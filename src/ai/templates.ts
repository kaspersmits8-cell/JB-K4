import { z } from "zod";
export const draftSchema = z.object({ sentences: z.array(z.object({ text: z.string().min(1), evidenceIds: z.array(z.string()), kind: z.enum(["fact", "uncertainty", "next_step"]) }).strict()) }).strict();
export type Draft = z.infer<typeof draftSchema> & { origin: "Template" };
export type DraftInput = { language: "en" | "nl" | "fr"; findings: { id: string; question: string; state: string; value: number | string | boolean | null; evidenceIds: string[] }[]; nextStepId: string; expertQuestion?: string };
const languageCopy = {
  en: { supported: "Confirmed", indication: "Not yet confirmed", missing: "This information still needs confirmation", next: "Next step", question: "Could you confirm the missing fact and identify the authoritative source?", correction: "Could you confirm the correction approach under the current procedure?", labels: { agreed_regime: "Agreed work regime", processed_regime: "Processed work regime", reference_salary: "Full-time reference salary (gross)", paid_base_salary: "Base salary paid (gross)" }, steps: { request_confirmation: "request confirmation before answering", start_correction_review: "request payroll lead review of a correction", explain_to_client: "explain the confirmed findings" } },
  nl: { supported: "Bevestigd", indication: "Nog niet bevestigd", missing: "Deze informatie moet nog worden bevestigd", next: "Volgende stap", question: "Kun je het ontbrekende gegeven bevestigen en de gezaghebbende bron aanwijzen?", correction: "Kun je de correctieaanpak volgens de huidige procedure bevestigen?", labels: { agreed_regime: "Afgesproken werkregime", processed_regime: "Verwerkt werkregime", reference_salary: "Voltijds referentieloon (bruto)", paid_base_salary: "Uitbetaald basisloon (bruto)" }, steps: { request_confirmation: "vraag bevestiging voordat je antwoordt", start_correction_review: "vraag een payroll lead de correctie te beoordelen", explain_to_client: "licht de bevestigde bevindingen toe" } },
  fr: { supported: "Confirmé", indication: "Pas encore confirmé", missing: "Cette information reste à confirmer", next: "Prochaine étape", question: "Pouvez-vous confirmer le fait manquant et identifier la source faisant autorité ?", correction: "Pouvez-vous confirmer la démarche de correction selon la procédure actuelle ?", labels: { agreed_regime: "Régime de travail convenu", processed_regime: "Régime de travail traité", reference_salary: "Salaire de référence à temps plein (brut)", paid_base_salary: "Salaire de base payé (brut)" }, steps: { request_confirmation: "demander confirmation avant de répondre", start_correction_review: "demander une revue de correction au responsable paie", explain_to_client: "expliquer les constats confirmés" } },
};
export function template(task: string, input: DraftInput): z.infer<typeof draftSchema> {
  const copy = languageCopy[input.language];
  if (task === "draftExpertQuestion") return { sentences: [{ text: input.expertQuestion === "confirm_correction_approach" ? copy.correction : copy.question, kind: "next_step", evidenceIds: input.findings.flatMap(f => f.evidenceIds) }] };
  const sentences: z.infer<typeof draftSchema>["sentences"] = input.findings.map(f => {
    const label = copy.labels[f.id as keyof typeof copy.labels] || f.question;
    if (f.value === null || !f.evidenceIds.length) return { text: `${label}: ${copy.missing}.`, kind: "uncertainty" as const, evidenceIds: [] };
    const value = typeof f.value === "number" ? `${f.value.toLocaleString(input.language)}${f.id.includes("regime") ? "%" : " EUR"}` : String(f.value);
    return { text: `${label}: ${value}. ${f.state === "SUPPORTED" ? copy.supported : copy.indication}.`, kind: f.state === "SUPPORTED" ? "fact" as const : "uncertainty" as const, evidenceIds: f.evidenceIds };
  });
  sentences.push({ text: `${copy.next}: ${copy.steps[input.nextStepId as keyof typeof copy.steps] || copy.steps.request_confirmation}.`, evidenceIds: [], kind: "next_step" });
  return { sentences };
}

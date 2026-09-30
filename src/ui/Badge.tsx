import type { State } from "../engine/types.ts";
import { copy } from "./copy.ts";
export function Badge({ state }: { state: State }) {
  return <span className={`badge ${state.toLowerCase()}`} title={copy.stateMeanings[state]}><span aria-hidden="true">{{ SUPPORTED: "✓", INDICATION: "◐", CONFLICTING: "⇄", INSUFFICIENT: "?" }[state]}</span> {copy.states[state]}</span>;
}

import type { User } from "./repo/index.ts";

export const localUserId = "local-preview";

export function localLoginEnabled() {
  return process.env.NODE_ENV === "development" && process.env.LOCAL_DEMO_LOGIN === "true";
}

// This preview identity has no dataset person and never receives client scope.
export function localUser(): User | null {
  return localLoginEnabled() ? { id: localUserId, email: "1", personId: "", role: "consultant" } : null;
}

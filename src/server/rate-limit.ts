import { AppError } from "./errors.ts";
export class LoginLimit {
  entries = new Map<string, { start: number; count: number }>();
  check(ip: string, email: string, now = Date.now()) {
    for (const [key, value] of this.entries) if (now - value.start >= 15 * 60 * 1000) this.entries.delete(key);
    const key = `${ip}:${email.toLowerCase()}`, previous = this.entries.get(key);
    if (previous && previous.count >= 5) throw new AppError(429, "too_many_attempts");
    if (!previous && this.entries.size >= 10000) throw new AppError(429, "too_many_attempts");
    this.entries.set(key, { start: previous?.start ?? now, count: (previous?.count || 0) + 1 });
  }
}
export const loginLimit = new LoginLimit();

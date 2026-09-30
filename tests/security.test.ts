import { afterEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy.ts";
import nextConfig from "../next.config.ts";
import { LoginLimit } from "../src/server/rate-limit.ts";
import { jsonBody } from "../src/server/http.ts";

afterEach(() => vi.unstubAllEnvs());
test("production security policy uses unique script nonces and no unsafe evaluation", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const a = proxy(new NextRequest("http://localhost/cases")), b = proxy(new NextRequest("http://localhost/cases"));
  const policy = a.headers.get("content-security-policy")!;
  expect(policy).toContain("'nonce-"); expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).not.toContain("unsafe-inline"); expect(policy).not.toContain("unsafe-eval");
  expect(policy).not.toBe(b.headers.get("content-security-policy"));
  expect(a.headers.get("cache-control")).toBe("no-store");
  const headers = await nextConfig.headers!();
  expect(headers[0].headers).toEqual(expect.arrayContaining([
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "no-referrer" },
  ]));
});
test("login throttle is case-insensitive, bounded and expires after fifteen minutes", () => {
  const limit = new LoginLimit();
  for (let n = 0; n < 5; n++) limit.check("ip", "JAN@example.com", 0);
  expect(() => limit.check("ip", "jan@example.com", 1)).toThrow("too_many_attempts");
  expect(() => limit.check("ip", "jan@example.com", 15 * 60 * 1000)).not.toThrow();
  expect(limit.entries.size).toBe(1);
});
test("body limits also reject chunked bodies without Content-Length", async () => {
  const request = new Request("http://localhost/api/cases", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "x".repeat(16001) }) });
  await expect(jsonBody(request)).rejects.toThrow("request_too_large");
});

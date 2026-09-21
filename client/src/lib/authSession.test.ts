import { describe, expect, it } from "vitest";
import { readLegacyCookieSession } from "./authSession";

describe("authSession", () => {
  it("reads a cookie token from the legacy sessionStorage fallback", () => {
    const storage = {
      getItem: (key: string) => (key === "manus-cookie" ? "app_session_id=abc123; Path=/" : null),
    } as Storage;

    expect(readLegacyCookieSession(storage, "app_session_id")).toBe("abc123");
  });
});

import { describe, expect, it } from "vitest";
import { getAuthRedirectTarget, readLegacyCookieSession } from "../client/src/lib/authSession";

describe("authSession", () => {
  it("reads a cookie token from the legacy sessionStorage fallback", () => {
    const storage = {
      getItem: (key: string) => (key === "manus-cookie" ? "app_session_id=abc123; Path=/" : null),
    } as Storage;

    expect(readLegacyCookieSession(storage, "app_session_id")).toBe("abc123");
  });

  it("preserves the current page when building the OAuth redirect target", () => {
    const location = {
      origin: "http://localhost:3000",
      pathname: "/deposit/eth",
      search: "?tab=wallet",
      hash: "#connect",
    } as Location;

    expect(getAuthRedirectTarget(location)).toBe("http://localhost:3000/deposit/eth?tab=wallet#connect");
  });
});

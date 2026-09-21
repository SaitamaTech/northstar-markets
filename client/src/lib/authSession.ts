import { COOKIE_NAME } from "@shared/const";
import type { SupabaseClient } from "@supabase/supabase-js";

export function readLegacyCookieSession(
  storage: Pick<Storage, "getItem"> | Storage | null,
  cookieName = COOKIE_NAME,
): string | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem("manus-cookie");
    if (!raw) return null;

    const prefix = `${cookieName}=`;
    const pair = raw
      .split(";")
      .find((segment) => segment.trim().startsWith(prefix));

    return pair?.trim().slice(prefix.length) ?? null;
  } catch {
    return null;
  }
}

export function getAuthRedirectTarget(
  targetLocation: Pick<Location, "origin" | "pathname" | "search" | "hash"> | Location | null = globalThis.location,
): string {
  if (!targetLocation) {
    return "";
  }

  const { origin, pathname, search, hash } = targetLocation;
  return `${origin}${pathname}${search}${hash}`;
}

export async function getAccessTokenForRequest(
  supabaseClient: Pick<SupabaseClient, "auth">,
  storage: Pick<Storage, "getItem"> | Storage | null = globalThis.sessionStorage,
): Promise<string | null> {
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (!error && session?.access_token) {
    return session.access_token;
  }

  return readLegacyCookieSession(storage, COOKIE_NAME);
}

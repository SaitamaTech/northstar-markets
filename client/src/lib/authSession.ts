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

function getConfiguredAppOrigin(): string {
  const configuredOrigin = (
    (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_APP_URL ?? import.meta.env.NEXT_PUBLIC_APP_URL ?? import.meta.env.APP_URL)) ??
    ""
  )?.toString().trim();

  if (configuredOrigin) return configuredOrigin.replace(/\/+$/, "");

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}

export function getAuthRedirectTarget(
  targetLocation: Pick<Location, "origin" | "pathname" | "search" | "hash"> | Location | string | null = globalThis.location,
  defaultPath = "/dashboard",
): string {
  if (typeof targetLocation === "string") {
    if (targetLocation.startsWith("http://") || targetLocation.startsWith("https://")) {
      return targetLocation;
    }
    return `${getConfiguredAppOrigin()}${targetLocation.startsWith("/") ? targetLocation : `/${targetLocation}`}`;
  }

  if (!targetLocation) {
    return `${getConfiguredAppOrigin()}${defaultPath}`;
  }

  if (typeof window !== "undefined" && window.location && targetLocation === window.location) {
    const { origin, pathname, search, hash } = targetLocation;
    const nextPath = pathname && pathname !== "/" ? pathname : defaultPath;
    return `${origin}${nextPath}${search}${hash}`;
  }

  if ("pathname" in targetLocation) {
    const { origin, pathname, search, hash } = targetLocation;
    const nextPath = pathname && pathname !== "/" ? pathname : defaultPath;
    return `${origin}${nextPath}${search}${hash}`;
  }

  return `${getConfiguredAppOrigin()}${defaultPath}`;
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

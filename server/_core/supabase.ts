import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseServer = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application-name": "northstar-markets" } },
    })
  : null;

export async function getSupabaseUser(req: Request) {
  const authorization = req.headers.authorization;
  if (!supabaseServer || typeof authorization !== "string" || !authorization.startsWith("Bearer ")) return null;
  const { data, error } = await supabaseServer.auth.getUser(authorization.slice(7));
  if (error) {
    console.warn("[Supabase] Token verification failed:", error.message);
    return null;
  }
  return data.user;
}
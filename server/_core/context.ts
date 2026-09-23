import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { sdk } from "./sdk";
import { getSupabaseUser } from "./supabase";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    const supabaseUser = await getSupabaseUser(opts.req);
    if (supabaseUser) {
      const email = supabaseUser.email ?? supabaseUser.user_metadata?.email ?? null;
      const isAdmin = email ? ENV.adminEmails.includes(String(email).trim().toLowerCase()) : false;

      user = {
        id: 0,
        openId: supabaseUser.id,
        name: (supabaseUser.user_metadata?.display_name ?? supabaseUser.user_metadata?.full_name ?? supabaseUser.user_metadata?.name ?? null) as string | null,
        email,
        loginMethod: "supabase",
        role: isAdmin ? "admin" : "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

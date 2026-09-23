import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ENV } from "./env";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export function isAdminUserForAccess(user: { role?: string | null; email?: string | null; openId?: string | null; user_metadata?: { email?: string | null } | null } | null): boolean {
  if (!user) return false;

  if (user.role === "admin") return true;
  if (user.openId && ENV.ownerOpenId && user.openId === ENV.ownerOpenId) return true;

  const candidateEmails = [
    user.email,
    (user as { user_metadata?: { email?: string | null } } | null)?.user_metadata?.email,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  const normalizedEmails = candidateEmails.map((value) => value.trim().toLowerCase());
  return normalizedEmails.some((email) => ENV.adminEmails.includes(email));
}

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!isAdminUserForAccess(ctx.user)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

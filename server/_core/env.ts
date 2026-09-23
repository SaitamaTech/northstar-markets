const parseAdminEmails = () => {
  const raw = [
    process.env.ADMIN_EMAILS,
    process.env.VITE_ADMIN_EMAILS,
    process.env.ADMIN_EMAIL,
  ].filter((value): value is string => Boolean(value));

  return raw
    .flatMap((value) => value.split(/[;,]/))
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .filter((entry, index, list) => list.indexOf(entry) === index);
};

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  adminEmails: parseAdminEmails().length > 0 ? parseAdminEmails() : ["israellawal323@gmail.com"],
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

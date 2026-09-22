export function resolveReceiveWalletAddress({
  connectedWalletAddress,
  configuredWalletAddress,
}: {
  connectedWalletAddress?: string | null;
  configuredWalletAddress?: string | null;
}): string | null {
  const configured = (configuredWalletAddress ?? "").trim();
  if (configured) {
    return configured;
  }

  const connected = (connectedWalletAddress ?? "").trim();
  return connected || null;
}

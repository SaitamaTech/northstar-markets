export type WalletConnectionInput = {
  walletAddress: string;
  network: string;
  walletProvider: string;
};

export function normalizeWalletAddress(value: string): string {
  const walletAddress = value.trim();

  if (!walletAddress) {
    throw new Error("A wallet address is required.");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error("Enter a valid wallet address for the connected wallet.");
  }

  return walletAddress.toLowerCase();
}

export function validateWalletConnectionPayload(input: Partial<WalletConnectionInput>): WalletConnectionInput {
  if (!input.walletAddress || typeof input.walletAddress !== "string") {
    throw new Error("A wallet address is required.");
  }

  if (!input.network || typeof input.network !== "string" || !input.network.trim()) {
    throw new Error("A wallet network is required.");
  }

  if (!input.walletProvider || typeof input.walletProvider !== "string" || !input.walletProvider.trim()) {
    throw new Error("A wallet provider is required.");
  }

  const normalizedNetwork = input.network.trim();
  const normalizedProvider = input.walletProvider.trim();

  if (!/^eip155:(?:\d+)$/.test(normalizedNetwork)) {
    throw new Error("Use a valid EVM network identifier such as eip155:1.");
  }

  return {
    walletAddress: normalizeWalletAddress(input.walletAddress),
    network: normalizedNetwork,
    walletProvider: normalizedProvider,
  };
}

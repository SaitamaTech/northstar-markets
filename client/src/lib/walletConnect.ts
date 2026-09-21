import { WalletConnectModal } from "@walletconnect/modal";
import { SignClient } from "@walletconnect/sign-client";

export type WalletConnection = {
  address: string;
  network: string;
  walletProvider: string;
};

const walletConnectProjectId = (
  import.meta.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ??
  ""
).trim();

const walletConnectMetadata = {
  name: "Northstar Markets",
  description: "Professional crypto trading and portfolio workspace.",
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:5173",
  icons: ["https://uploads-ssl.webflow.com/5f7d289d4f2e2d1d302b6a1d/5f7d289d4f2e2d1d302b6a1d.png"],
};

let walletConnectClientPromise: Promise<InstanceType<typeof SignClient>> | null = null;
let walletConnectModalInstance: WalletConnectModal | null = null;

export function getWalletConnectProjectId() {
  return walletConnectProjectId;
}

export async function getWalletConnectClient() {
  if (!walletConnectProjectId) {
    throw new Error("Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID or VITE_WALLETCONNECT_PROJECT_ID.");
  }

  if (!walletConnectClientPromise) {
    walletConnectClientPromise = SignClient.init({
      projectId: walletConnectProjectId,
      metadata: walletConnectMetadata,
    });
  }

  return walletConnectClientPromise;
}

export function getWalletConnectModal() {
  if (!walletConnectProjectId) {
    return null;
  }

  if (!walletConnectModalInstance) {
    walletConnectModalInstance = new WalletConnectModal({
      projectId: walletConnectProjectId,
      themeMode: "dark",
      themeVariables: { "--wcm-z-index": "999999" },
    });
  }

  return walletConnectModalInstance;
}

export async function connectTrustWallet(): Promise<WalletConnection> {
  const client = await getWalletConnectClient();
  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      eip155: {
        methods: ["eth_sendTransaction", "personal_sign", "eth_signTypedData", "eth_signTypedData_v4"],
        chains: ["eip155:1"],
        events: ["chainChanged", "accountsChanged"],
      },
    },
  });

  const modal = getWalletConnectModal();
  if (uri && modal) {
    modal.openModal({ uri });
  }

  const session = await approval();
  modal?.closeModal();

  const account = session.namespaces.eip155?.accounts?.[0];
  const network = session.namespaces.eip155?.chains?.[0] ?? "eip155:1";

  if (!account) {
    throw new Error("No wallet account was returned from the selected wallet.");
  }

  const walletAddress = account.split(":").pop();
  if (!walletAddress) {
    throw new Error("The connected wallet did not return a valid address.");
  }

  const walletProvider = session.peer?.metadata?.name?.toLowerCase().includes("trust") ? "trust" : "walletconnect";

  return {
    address: walletAddress,
    network,
    walletProvider,
  };
}

export async function restoreWalletConnection(): Promise<WalletConnection | null> {
  try {
    const client = await getWalletConnectClient();
    const sessions = client.session.getAll();
    const session = sessions[0];
    if (!session) return null;

    const account = session.namespaces.eip155?.accounts?.[0];
    if (!account) return null;

    const walletAddress = account.split(":").pop();
    if (!walletAddress) return null;

    const network = session.namespaces.eip155?.chains?.[0] ?? "eip155:1";
    const walletProvider = session.peer?.metadata?.name?.toLowerCase().includes("trust") ? "trust" : "walletconnect";

    return {
      address: walletAddress,
      network,
      walletProvider,
    };
  } catch (error) {
    console.warn("[WalletConnect] Session restore failed:", error);
    return null;
  }
}

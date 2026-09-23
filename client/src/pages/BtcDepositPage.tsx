import QRCode from "qrcode";
import { CheckCircle2, Copy, ExternalLink, Loader2, ShieldCheck, Wallet2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SupabaseAuthDialog } from "@/components/SupabaseAuthDialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { trpc } from "@/lib/trpc";
import { resolveReceiveWalletAddress } from "@/lib/walletAddress";
import { connectTrustWallet, type WalletConnection } from "@/lib/walletConnect";

export default function BtcDepositPage() {
  const { user, loading: authLoading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [connectedWallet, setConnectedWallet] = useState<WalletConnection | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const walletStatusQuery = trpc.wallet.status.useQuery(undefined, { enabled: Boolean(user), staleTime: 30_000 });
  const walletConnectMutation = trpc.wallet.connect.useMutation();
  const walletDisconnectMutation = trpc.wallet.disconnect.useMutation();
  const balanceQuery = trpc.btc.balance.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 15_000 });
  const priceQuery = trpc.market.instrument.useQuery({ symbol: "BTC" }, { staleTime: 30_000, refetchInterval: 30_000 });
  const configuredOwnerWalletAddress = (import.meta.env.VITE_OWNER_WALLET_ADDRESS ?? import.meta.env.NEXT_PUBLIC_OWNER_WALLET_ADDRESS ?? "").trim();
  const depositAddress = resolveReceiveWalletAddress({
    connectedWalletAddress: connectedWallet?.address ?? walletStatusQuery.data?.walletAddress ?? null,
    configuredWalletAddress: configuredOwnerWalletAddress,
  });
  const network = walletStatusQuery.data?.network === "testnet" ? "testnet" : "mainnet";
  const requiresLogin = !authLoading && !user;
  const btc = balanceQuery.data?.btc ?? 0;
  const price = priceQuery.data?.price ?? 0;

  const networkLabel = connectedWallet?.network === "eip155:1" ? "Mainnet" : connectedWallet?.network === "eip155:11155111" ? "Sepolia" : connectedWallet?.network ?? "Mainnet";
  const formattedAddress = connectedWallet ? `${connectedWallet.address.slice(0, 6)}...${connectedWallet.address.slice(-4)}` : "";

  const connectWallet = async () => {
    if (authLoading) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }

    setWalletError(null);
    setWalletLoading(true);

    try {
      const connected = await connectTrustWallet();
      const saved = await walletConnectMutation.mutateAsync({
        walletAddress: connected.address,
        network: connected.network,
        walletProvider: connected.walletProvider,
      });

      setConnectedWallet({
        address: saved.walletAddress,
        network: saved.network,
        walletProvider: saved.walletProvider,
      });

      notify("Wallet connected and saved to your account.", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Wallet connection failed.";
      setWalletError(message);
      notify("Wallet connection failed.", "error");
    } finally {
      setWalletLoading(false);
    }
  };

  const disconnectWallet = async () => {
    if (!user) return;

    setWalletLoading(true);
    setWalletError(null);

    try {
      await walletDisconnectMutation.mutateAsync();
      setConnectedWallet(null);
      await walletStatusQuery.refetch();
      notify("Wallet disconnected.", "success");
    } catch (error) {
      setConnectedWallet(null);
      const configError = error instanceof Error && /Supabase|configured|SERVICE_UNAVAILABLE/i.test(error.message);
      const message = configError
        ? "Wallet disconnect is unavailable because the server is missing a valid Supabase service-role key. Add SUPABASE_SERVICE_ROLE_KEY to your environment and restart the app."
        : error instanceof Error ? error.message : "Unable to disconnect the wallet.";
      setWalletError(message);
      notify(message, "error");
    } finally {
      setWalletLoading(false);
    }
  };

  const copyWalletAddress = async () => {
    if (!connectedWallet?.address) return;
    await navigator.clipboard.writeText(connectedWallet.address);
    notify("Wallet address copied.", "success");
  };

  useEffect(() => {
    if (!user) {
      setConnectedWallet(null);
      return;
    }

    if (walletStatusQuery.data?.connected && walletStatusQuery.data.walletAddress) {
      setConnectedWallet({
        address: walletStatusQuery.data.walletAddress,
        network: walletStatusQuery.data.network ?? "eip155:1",
        walletProvider: walletStatusQuery.data.walletProvider ?? "trust",
      });
      return;
    }

    setConnectedWallet(null);
  }, [user, walletStatusQuery.data]);

  useEffect(() => {
    if (!depositAddress) return;
    void QRCode.toDataURL(`ethereum:${depositAddress}`, { width: 220, margin: 2, color: { dark: "#0b1725", light: "#ffffff" } }).then(setQr);
  }, [depositAddress]);

  const copyAddress = async () => {
    if (!depositAddress) return;
    await navigator.clipboard.writeText(depositAddress);
    notify("Ethereum deposit address copied.", "success");
  };

  return <AppShell><div className="page-shell feature-shell btc-deposit-shell">
    <div className="workspace-heading feature-heading"><div><div className="breadcrumb"><span>Wallet</span><span>/</span><strong>Deposit ETH</strong></div><h1>Deposit Ethereum</h1><p>Connect your wallet, then send ETH to the wallet address shown below. This is your own receiving wallet, not a platform-owned deposit address.</p></div><div className={network === "testnet" ? "network-badge testnet" : "network-badge"}>{network === "testnet" ? "TESTNET MODE" : "ETHEREUM MAINNET"}</div></div>
    {authLoading ? <section className="section-card settings-auth-card"><ShieldCheck size={32} /><h2>Checking your account</h2><p>Verifying your secure session before loading your Ethereum wallet details.</p></section> : requiresLogin ? <section className="section-card settings-auth-card"><ShieldCheck size={32} /><h2>Sign in to continue</h2><p>Your connected wallet and receipt activity stay tied to your authenticated account.</p><Button type="button" onClick={() => setAuthOpen(true)}>Sign in</Button></section> : <>
      <div className="btc-summary-grid"><section className="section-card btc-balance-card"><span className="section-eyebrow">Available ETH balance</span><strong>Ξ {btc.toFixed(8)}</strong><span>Estimated value ${ (btc * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</span></section><section className="section-card btc-balance-card"><span className="section-eyebrow">Current ETH price</span><strong>${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong><span className={priceQuery.data?.changePct && priceQuery.data.changePct >= 0 ? "positive" : "negative"}>{priceQuery.data?.changePct ? `${priceQuery.data.changePct >= 0 ? "+" : ""}${priceQuery.data.changePct.toFixed(2)}% 24H` : "Live quote"}</span></section></div>
      <div className="btc-deposit-grid">
        <section className="section-card btc-address-card">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">Wallet</span>
              <h2>Connect wallet</h2>
            </div>
            <span className="network-chip">{connectedWallet ? networkLabel : "Not connected"}</span>
          </div>
          {walletLoading ? <div className="btc-loading"><Loader2 className="spin" size={18} /> Connecting wallet...</div> : connectedWallet ? <>
            <div className="btc-address-box"><code>{formattedAddress}</code><button type="button" aria-label="Copy wallet address" onClick={copyWalletAddress}><Copy size={16} /></button></div>
            <div className="wallet-meta-row">
              <span className="wallet-meta-pill">Provider: {connectedWallet.walletProvider}</span>
              <span className="wallet-meta-pill">Network: {networkLabel}</span>
            </div>
            <div className="wallet-actions-row">
              <Button type="button" variant="outline" onClick={copyWalletAddress}><Copy size={14} /> Copy address</Button>
              <Button type="button" variant="secondary" onClick={disconnectWallet}><CheckCircle2 size={14} /> Disconnect wallet</Button>
            </div>
          </> : <>
            <div className="wallet-empty-state">
              <div className="wallet-empty-icon"><Wallet2 size={26} /></div>
              <p>Connect your wallet first. The wallet address shown below will be the address you receive ETH to.</p>
            </div>
            <Button type="button" onClick={connectWallet} className="full-button"><Wallet2 size={15} /> Connect wallet</Button>
          </>}
          {walletError ? <p className="btc-provider-error">{walletError}</p> : null}
        </section>
        <section className="section-card btc-address-card"><div className="section-header"><div><span className="section-eyebrow">Your wallet address</span><h2>Ethereum network</h2></div><span className="network-chip">{network}</span></div>{!depositAddress ? <div className="btc-provider-error">Connect a wallet to see the ETH receiving address.</div> : <><div className="btc-qr-wrap">{qr && <img src={qr} alt="QR code for Ethereum wallet address" />}</div><div className="btc-address-box"><code>{depositAddress}</code><button type="button" aria-label="Copy Ethereum wallet address" onClick={copyAddress}><Copy size={16} /></button></div><p className="btc-warning">This is your own wallet address. Only send ETH on the Ethereum network to this address. Do not send ETH to a platform-owned deposit address.</p></>}</section>
      </div>
      <aside className="section-card btc-info-card"><span className="section-eyebrow">Deposit details</span><div><span>Minimum deposit</span><strong>0.0001 ETH</strong></div><div><span>Required confirmations</span><strong>3</strong></div><div><span>Estimated confirmation time</span><strong>1-5 minutes</strong></div><div><span>Daily yield</span><strong>12% APR auto-added every day</strong></div><div><span>Accounting</span><strong>Credited after confirmation</strong></div><a href="/deposits" className="button button-secondary button-sm">View deposit history <ExternalLink size={14} /></a><a href="/investments" className="button button-secondary button-sm" style={{ marginTop: "10px" }}>Open investments <ExternalLink size={14} /></a></aside>
    </>}
    <SupabaseAuthDialog open={authOpen} onOpenChange={setAuthOpen} />
  </div></AppShell>;
}

import { ArrowUpRight, CheckCircle2, Clock3, ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { SupabaseAuthDialog } from "@/components/SupabaseAuthDialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

function explorerUrl(network: string, hash: string) {
  return `${network === "mainnet" ? "https://blockstream.info" : "https://blockstream.info/testnet"}/tx/${hash}`;
}

export default function BtcDepositsPage() {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const query = trpc.btc.deposits.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 15_000 });
  const network = query.data?.[0]?.network ?? "testnet";
  return <AppShell><div className="page-shell feature-shell deposits-shell">
    <div className="workspace-heading feature-heading"><div><div className="breadcrumb"><span>Wallet</span><span>/</span><strong>ETH deposits</strong></div><h1>Ethereum deposit history</h1><p>Track detection and confirmation progress for your authenticated account.</p></div><Link href="/deposit/eth" className="button button-primary button-sm">Deposit ETH <ArrowUpRight size={14} /></Link></div>
    {!user ? <section className="section-card settings-auth-card"><ShieldCheck size={32} /><h2>Sign in to view deposits</h2><p>Deposit records are private to the authenticated account that owns the address.</p><Button type="button" onClick={() => setAuthOpen(true)}>Sign in</Button></section> : <section className="section-card deposits-card"><div className="section-header"><div><span className="section-eyebrow">Blockchain activity</span><h2>ETH deposits</h2></div><span className="live-status"><i /> Updates every 15 seconds</span></div>{query.isLoading ? <div className="btc-loading">Checking the Ethereum network...</div> : query.data?.length ? <div className="deposits-table"><div className="deposits-head"><span>Date</span><span>Amount</span><span>Status</span><span>Confirmations</span><span>Transaction</span></div>{query.data.map(deposit => <div className="deposit-row" key={deposit.id}><span>{new Date(deposit.createdAt).toLocaleString()}</span><strong>Ξ {(deposit.amountSatoshis / 100_000_000).toFixed(8)}</strong><span className={`deposit-status ${deposit.status}`}><i />{deposit.status}</span><span>{deposit.confirmations}/{deposit.requiredConfirmations}</span><a href={explorerUrl(network, deposit.transactionHash)} target="_blank" rel="noreferrer" title="Open transaction in block explorer"><code>{deposit.transactionHash.slice(0, 10)}...{deposit.transactionHash.slice(-8)}</code><ExternalLink size={13} /></a></div>)}</div> : <div className="deposits-empty"><Clock3 size={22} /><h3>No ETH deposits yet</h3><p>Your confirmed and pending blockchain deposits will appear here.</p><Link href="/deposit/eth" className="button button-secondary button-sm">Get a deposit address</Link></div>}</section>}
    <div className="deposit-security-note"><CheckCircle2 size={15} /> Balances are credited only after the configured confirmation threshold. Duplicate transaction hashes cannot create a second ledger credit.</div>
    <SupabaseAuthDialog open={authOpen} onOpenChange={setAuthOpen} />
  </div></AppShell>;
}

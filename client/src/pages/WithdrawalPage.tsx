import { ArrowRight, CircleDollarSign, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { notify } from "@/lib/notify";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function WithdrawalPage() {
  const { isAuthenticated } = useAuth();
  const investmentsQuery = trpc.investments.list.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30_000 });
  const withdrawMutation = trpc.investments.withdraw.useMutation();
  const investments = investmentsQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedInvestment = useMemo(() => {
    return investments.find((item: any) => item.id === selectedId) ?? investments[0] ?? null;
  }, [investments, selectedId]);

  const handleWithdraw = async () => {
    if (!selectedInvestment) {
      notify("You do not have an active investment to withdraw.", "error");
      return;
    }

    try {
      await withdrawMutation.mutateAsync({
        investmentId: selectedInvestment.id,
      });
      notify("Withdrawal complete. The funds have been returned to your available balance.", "success");
      await investmentsQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Withdrawal could not be completed.";
      notify(message, "error");
    }
  };

  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Portfolio</span>
              <span>/</span>
              <strong>Withdraw</strong>
            </div>
            <h1>Withdraw from investment</h1>
            <p>Return your active investment position back to your available wallet balance.</p>
          </div>
          <Link href="/investments/my-investments" className="button button-secondary button-sm">My investments</Link>
        </div>

        {!isAuthenticated ? (
          <section className="section-card settings-auth-card">
            <ShieldCheck size={32} />
            <h2>Sign in to withdraw</h2>
            <p>Your active investment balances and withdrawal requests are tied to the authenticated account.</p>
            <Link href="/investments" className="button button-primary button-sm">Back to plans</Link>
          </section>
        ) : investments.length === 0 ? (
          <section className="section-card settings-auth-card">
            <CircleDollarSign size={32} />
            <h2>No active investment to withdraw</h2>
            <p>Move funds into an investment plan first, then withdraw once the balance is ready to be returned.</p>
            <Link href="/investments" className="button button-primary button-sm">Start investing</Link>
          </section>
        ) : (
          <div className="btc-deposit-grid">
            <section className="section-card btc-address-card">
              <div className="section-header">
                <div>
                  <span className="section-eyebrow">Active positions</span>
                  <h2>Select investment</h2>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                {investments.filter((item: any) => item.status === "ACTIVE").map((item: any) => (
                  <button
                    key={item.id}
                    type="button"
                    className="section-card"
                    style={{ padding: "16px", border: selectedInvestment?.id === item.id ? "1px solid rgba(94,234,212,.45)" : "1px solid rgba(148,163,184,.18)", background: selectedInvestment?.id === item.id ? "rgba(94,234,212,.06)" : "transparent", textAlign: "left", cursor: "pointer" }}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <strong>{item.plan?.name ?? "Investment"}</strong>
                      <span className="network-chip">{item.asset}</span>
                    </div>
                    <div style={{ marginTop: "8px", display: "grid", gap: "4px", color: "var(--muted)", fontSize: "12px" }}>
                      <span>Current value: ${Number(item.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span>Earned: ${Number(item.accruedInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="section-card btc-address-card">
              <div className="section-header">
                <div>
                  <span className="section-eyebrow">Withdrawal review</span>
                  <h2>Confirm exit</h2>
                </div>
              </div>

              {selectedInvestment && (
                <div style={{ display: "grid", gap: "16px" }}>
                  <div className="section-card" style={{ padding: "18px", display: "grid", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                      <span>Investment</span>
                      <strong style={{ color: "var(--foreground)" }}>{selectedInvestment.plan?.name ?? "Investment"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                      <span>Current value</span>
                      <strong style={{ color: "var(--foreground)" }}>${Number(selectedInvestment.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                      <span>Accrued</span>
                      <strong style={{ color: "var(--foreground)" }}>${Number(selectedInvestment.accruedInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                  </div>

                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "12px" }}>
                    This withdrawal exits the full active position and returns the total current value back to your available balance.
                  </p>

                  <button type="button" className="button button-primary button-sm" onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
                    {withdrawMutation.isPending ? "Processing withdrawal..." : "Withdraw now"} <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

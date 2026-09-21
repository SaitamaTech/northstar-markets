import { ArrowUpRight, CalendarRange, CircleDollarSign, TrendingUp } from "lucide-react";
import { useParams } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function InvestmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const investmentId = Number(id ?? 0);
  const investmentQuery = trpc.investments.detail.useQuery({ investmentId }, { enabled: isAuthenticated && Boolean(id), staleTime: 30_000 });
  const investment = investmentQuery.data;

  if (!investment) {
    return <AppShell><div className="page-shell feature-shell"><section className="section-card settings-auth-card"><CircleDollarSign size={32} /><h2>Investment not found</h2><p>The requested investment could not be loaded.</p></section></div></AppShell>;
  }

  const startDate = new Date(investment.startDate);
  const maturityDate = new Date(investment.maturityDate ?? investment.startDate);
  const elapsedDays = Math.max(0, Math.ceil((Date.now() - startDate.getTime()) / 86400000));
  const remainingDays = Math.max(0, Math.ceil((maturityDate.getTime() - Date.now()) / 86400000));

  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Portfolio</span>
              <span>/</span>
              <strong>Investment detail</strong>
            </div>
            <h1>{investment.plan?.name ?? "Investment"}</h1>
            <p>Detailed view of your earnings, accrual history, and maturity timing.</p>
          </div>
        </div>

        <div className="btc-summary-grid">
          <section className="section-card btc-balance-card"><span className="section-eyebrow">Principal</span><strong>${Number(investment.principalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><span>Initial investment</span></section>
          <section className="section-card btc-balance-card"><span className="section-eyebrow">Current value</span><strong>${Number(investment.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><span>Principal + accrued interest</span></section>
          <section className="section-card btc-balance-card"><span className="section-eyebrow">Total interest</span><strong>${Number(investment.accruedInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><span>Accumulated to date</span></section>
          <section className="section-card btc-balance-card"><span className="section-eyebrow">Daily interest</span><strong>${Number(investment.dailyInterestAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><span>Auto-added daily</span></section>
        </div>

        <div className="btc-deposit-grid">
          <section className="section-card btc-address-card">
            <div className="section-header">
              <div><span className="section-eyebrow">Summary</span><h2>Investment details</h2></div>
              <span className="network-chip">{investment.status}</span>
            </div>
            <div style={{ display: "grid", gap: "10px", color: "var(--muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Interest rate</span><strong style={{ color: "var(--foreground)" }}>{Number(investment.interestRate) * 100}% daily</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Start date</span><strong style={{ color: "var(--foreground)" }}>{startDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Maturity date</span><strong style={{ color: "var(--foreground)" }}>{maturityDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Days elapsed</span><strong style={{ color: "var(--foreground)" }}>{elapsedDays}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Days remaining</span><strong style={{ color: "var(--foreground)" }}>{remainingDays}</strong></div>
            </div>
          </section>

          <section className="section-card btc-address-card">
            <div className="section-header">
              <div><span className="section-eyebrow">Activity</span><h2>Accrual history</h2></div>
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              {(investment.history ?? []).slice(0, 8).map((entry) => (
                <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(148,163,184,.12)" }}>
                  <div>
                    <strong>{entry.transactionType}</strong>
                    <small style={{ display: "block", color: "var(--muted)" }}>{new Date(entry.accrualDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</small>
                  </div>
                  <span style={{ color: "var(--positive)" }}>+${Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

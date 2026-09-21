import { ArrowRight, CalendarDays, CircleDollarSign, Clock3, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function MyInvestmentsPage() {
  const { isAuthenticated } = useAuth();
  const investmentsQuery = trpc.investments.list.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30_000 });
  const investments = investmentsQuery.data ?? [];

  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Portfolio</span>
              <span>/</span>
              <strong>Investments</strong>
            </div>
            <h1>My active investments</h1>
            <p>Track returns, plan maturity, and the accumulated earnings across your earning positions.</p>
          </div>
          <Link href="/investments" className="button button-secondary button-sm">Explore plans</Link>
        </div>

        {investments.length === 0 ? (
          <section className="section-card settings-auth-card">
            <CircleDollarSign size={32} />
            <h2>Your crypto is ready to work.</h2>
            <p>Move part of your available balance into an investment plan and monitor earnings from one dashboard.</p>
            <Link href="/investments" className="button button-primary button-sm">Start investing</Link>
          </section>
        ) : (
          <div style={{ display: "grid", gap: "18px" }}>
            {investments.map((investment) => {
              const start = new Date(investment.startDate);
              const maturity = new Date(investment.maturityDate ?? investment.startDate);
              const now = new Date();
              const elapsed = Math.max(0, Math.min(100, ((now.getTime() - start.getTime()) / Math.max(1, maturity.getTime() - start.getTime())) * 100));

              return (
                <section key={investment.id} className="section-card btc-address-card">
                  <div className="section-header">
                    <div>
                      <span className="section-eyebrow">{investment.asset}</span>
                      <h2>{investment.plan?.name ?? "Investment"}</h2>
                    </div>
                    <span className="network-chip">{investment.status}</span>
                  </div>
                  <div className="btc-summary-grid">
                    <div className="btc-balance-card section-card">
                      <span className="section-eyebrow">Principal</span>
                      <strong>${Number(investment.principalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="btc-balance-card section-card">
                      <span className="section-eyebrow">Earned</span>
                      <strong>${Number(investment.accruedInterest).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="btc-balance-card section-card">
                      <span className="section-eyebrow">Current value</span>
                      <strong>${Number(investment.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="btc-balance-card section-card">
                      <span className="section-eyebrow">Daily earnings</span>
                      <strong>${Number(investment.dailyInterestAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                      <span><CalendarDays size={12} /> Started</span>
                      <strong style={{ color: "var(--foreground)" }}>{new Date(investment.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                      <span><Clock3 size={12} /> Matures</span>
                      <strong style={{ color: "var(--foreground)" }}>{new Date(investment.maturityDate ?? investment.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, color: "var(--muted)", fontSize: 12 }}>
                      <span>Progress toward maturity</span>
                      <span>{elapsed.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 8, background: "rgba(148,163,184,.15)", borderRadius: 999 }}>
                      <div style={{ width: `${elapsed}%`, height: "100%", background: "linear-gradient(90deg, rgba(94,234,212,.8), rgba(59,130,246,.8))", borderRadius: 999 }} />
                    </div>
                  </div>

                  <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                    <Link href={`/investments/${investment.id}`} className="button button-secondary button-sm">View details <ArrowRight size={14} /></Link>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

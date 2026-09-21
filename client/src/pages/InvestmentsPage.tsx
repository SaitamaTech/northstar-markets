import { ArrowRight, BadgeDollarSign, CalendarDays, CircleDollarSign, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const investmentPeriods = ["Weekly", "Monthly", "Yearly"] as const;

export default function InvestmentsPage() {
  const { user, isAuthenticated } = useAuth();
  const plansQuery = trpc.investments.plans.useQuery(undefined, { staleTime: 60_000, refetchInterval: 15000 });
  const summaryQuery = trpc.investments.summary.useQuery(undefined, { enabled: isAuthenticated, staleTime: 30_000, refetchInterval: 15000 });
  const createMutation = trpc.investments.create.useMutation();
  const plans = plansQuery.data ?? [];
  const [selectedPeriod, setSelectedPeriod] = useState<(typeof investmentPeriods)[number]>("Weekly");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(plans[0]?.id ?? null);
  const [amount, setAmount] = useState("1000");
  const [asset, setAsset] = useState("USDT");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan: any) => {
      if (selectedPeriod === "Weekly") return Number(plan.durationDays) <= 14;
      if (selectedPeriod === "Monthly") return Number(plan.durationDays) > 14 && Number(plan.durationDays) <= 90;
      return Number(plan.durationDays) > 90;
    });
  }, [plans, selectedPeriod]);

  const selectedPlan = useMemo(() => {
    return filteredPlans.find((plan: any) => plan.id === selectedPlanId) ?? filteredPlans[0] ?? plans[0] ?? null;
  }, [filteredPlans, plans, selectedPlanId]);

  const principal = Number(amount || 0);
  const dailyReturn = selectedPlan ? principal * Number(selectedPlan.dailyRate) : 0;
  const durationReturn = selectedPlan ? dailyReturn * Number(selectedPlan.durationDays) : 0;
  const estimatedEndValue = selectedPlan ? principal + durationReturn : 0;
  const availableBalance = Number(summaryQuery.data?.availableBalance ?? 0);
  const annualizedYield = selectedPlan ? ((Math.pow(1 + Number(selectedPlan.dailyRate), 365) - 1) * 100) : 0;

  const handleCreateInvestment = async () => {
    if (!user) {
      notify("Sign in before creating a crypto investment.", "info");
      return;
    }

    if (!selectedPlan) {
      notify("Choose a valid plan to invest.", "error");
      return;
    }

    if (principal < Number(selectedPlan.minimumInvestment)) {
      notify(`The minimum investment for ${selectedPlan.name} is $${Number(selectedPlan.minimumInvestment).toLocaleString()}.`, "error");
      return;
    }

    if (principal > availableBalance) {
      notify("Your available balance is lower than the requested investment amount.", "error");
      return;
    }

    try {
      await createMutation.mutateAsync({
        planId: selectedPlan.id,
        amount: principal.toString(),
        asset: asset.toUpperCase(),
      });
      setConfirmOpen(false);
      notify("Investment created successfully. Your deposit has moved into the selected plan.", "success");
      await summaryQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Investment could not be created.";
      notify(message, "error");
    }
  };

  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Wallet</span>
              <span>/</span>
              <strong>Invest</strong>
            </div>
            <h1>Crypto investment plans</h1>
            <p>Move your available balance into a structured crypto earning plan and track the daily yield in real time.</p>
          </div>
          <div className="heading-actions">
            <Link href="/investments/my-investments" className="button button-secondary button-sm">My investments</Link>
          </div>
        </div>

        <div className="btc-summary-grid">
          <section className="section-card btc-balance-card">
            <span className="section-eyebrow">Available balance</span>
            <strong>${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <span>Ready to deploy</span>
          </section>
          <section className="section-card btc-balance-card">
            <span className="section-eyebrow">Invested balance</span>
            <strong>${Number(summaryQuery.data?.investedBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <span>Across active plans</span>
          </section>
          <section className="section-card btc-balance-card">
            <span className="section-eyebrow">Total earned</span>
            <strong>${Number(summaryQuery.data?.totalEarned ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <span>Accrued across investments</span>
          </section>
        </div>

        <div className="section-card" style={{ padding: "22px", marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <span className="section-eyebrow">Yield products</span>
              <h2 style={{ margin: "8px 0 0" }}>Choose a term that matches your goals</h2>
            </div>
            <div className="wallet-meta-row">
              {investmentPeriods.map((period) => (
                <button
                  key={period}
                  type="button"
                  className={period === selectedPeriod ? "wallet-meta-pill" : "wallet-meta-pill"}
                  style={{ border: period === selectedPeriod ? "1px solid rgba(94,234,212,.5)" : "1px solid rgba(148,163,184,.2)", background: period === selectedPeriod ? "rgba(94,234,212,.08)" : "rgba(15,23,42,.5)", color: "var(--foreground)" }}
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="btc-deposit-grid">
          <section className="section-card btc-address-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Plan options</span>
                <h2>{selectedPeriod} products</h2>
              </div>
              <span className="network-chip">Live yield</span>
            </div>
            <div style={{ display: "grid", gap: "16px" }}>
              {filteredPlans.length > 0 ? filteredPlans.map((plan: any) => {
                const apy = ((Math.pow(1 + Number(plan.dailyRate), 365) - 1) * 100);
                return (
                  <button
                    key={plan.id}
                    type="button"
                    className="section-card"
                    style={{ padding: "18px", border: selectedPlan?.id === plan.id ? "1px solid rgba(94,234,212,.45)" : "1px solid rgba(148,163,184,.18)", background: selectedPlan?.id === plan.id ? "rgba(94,234,212,.06)" : "transparent", textAlign: "left", cursor: "pointer" }}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <strong style={{ fontSize: "18px" }}>{plan.name}</strong>
                          <span className="network-chip">{plan.asset}</span>
                        </div>
                        <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: "12px" }}>{plan.description}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "12px", color: "var(--muted)" }}>Estimated APY</div>
                        <strong style={{ fontSize: "22px", color: "var(--positive, #5eead4)" }}>{apy.toFixed(2)}%</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
                      <div className="section-card" style={{ padding: "10px 12px", background: "rgba(15,23,42,.45)" }}>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>Min. deposit</div>
                        <strong>${Number(plan.minimumInvestment).toLocaleString()}</strong>
                      </div>
                      <div className="section-card" style={{ padding: "10px 12px", background: "rgba(15,23,42,.45)" }}>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>Term</div>
                        <strong>{plan.durationDays} days</strong>
                      </div>
                      <div className="section-card" style={{ padding: "10px 12px", background: "rgba(15,23,42,.45)" }}>
                        <div style={{ fontSize: "11px", color: "var(--muted)" }}>Daily rate</div>
                        <strong>{(Number(plan.dailyRate) * 100).toFixed(2)}%</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: "12px", color: "var(--muted)", fontSize: "11px" }}>
                      {plan.riskNote}
                    </div>
                  </button>
                );
              }) : <div className="section-card" style={{ padding: "18px" }}>No plans available for this term.</div>}
            </div>
          </section>

          <section className="section-card btc-address-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Investment calculator</span>
                <h2>Move funds into the plan</h2>
              </div>
            </div>
            <div style={{ display: "grid", gap: "14px" }}>
              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>Investment amount</span>
                <input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="1000" style={{ background: "rgba(15,23,42,.8)", border: "1px solid rgba(148,163,184,.2)", borderRadius: 12, color: "var(--foreground)", padding: "12px 14px" }} />
              </label>

              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>Asset</span>
                <select value={asset} onChange={(event) => setAsset(event.target.value)} style={{ background: "rgba(15,23,42,.8)", border: "1px solid rgba(148,163,184,.2)", borderRadius: 12, color: "var(--foreground)", padding: "12px 14px" }}>
                  {['USDT', 'BTC', 'ETH', 'SOL'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>

              <div className="wallet-meta-row">
                <span className="wallet-meta-pill"><TrendingUp size={14} /> Est. daily return: ${dailyReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="wallet-meta-pill"><BadgeDollarSign size={14} /> Est. total return: ${durationReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="section-card" style={{ padding: "18px", display: "grid", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Estimated ending value</span><strong style={{ color: "var(--foreground)" }}>${estimatedEndValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Plan duration</span><strong style={{ color: "var(--foreground)" }}>{selectedPlan?.durationDays ?? 0} days</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}><span>Annualized yield</span><strong style={{ color: "var(--foreground)" }}>{annualizedYield.toFixed(2)}%</strong></div>
              </div>

              <Button type="button" onClick={() => setConfirmOpen(true)} className="full-button">
                Invest now <ArrowRight size={15} />
              </Button>
            </div>
          </section>
        </div>

        {confirmOpen && selectedPlan && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,.68)", display: "grid", placeItems: "center", zIndex: 40, padding: 20 }}>
            <div className="section-card" style={{ width: "min(560px, 100%)", padding: "24px", display: "grid", gap: "18px" }}>
              <div>
                <span className="section-eyebrow">Confirm investment</span>
                <h2>Review your allocation</h2>
              </div>
              <div style={{ display: "grid", gap: 8, color: "var(--muted)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Plan</span><strong style={{ color: "var(--foreground)" }}>{selectedPlan.name}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Amount</span><strong style={{ color: "var(--foreground)" }}>${principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Asset</span><strong style={{ color: "var(--foreground)" }}>{asset.toUpperCase()}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Rate</span><strong style={{ color: "var(--foreground)" }}>{(Number(selectedPlan.dailyRate) * 100).toFixed(2)}% daily</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Estimated daily return</span><strong style={{ color: "var(--foreground)" }}>${dailyReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: "12px" }}>
                <input type="checkbox" defaultChecked />
                <span>I understand the returns are estimates and subject to the product terms and platform risk disclosures.</span>
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" className="button button-secondary button-sm" onClick={() => setConfirmOpen(false)}>Cancel</button>
                <button type="button" className="button button-primary button-sm" onClick={handleCreateInvestment} disabled={createMutation.isPending}>{createMutation.isPending ? "Confirming..." : "Confirm investment"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

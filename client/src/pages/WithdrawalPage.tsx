import { ArrowRight, ShieldCheck, TrendingUp, Wallet2 } from "lucide-react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { useAuth } from "@/_core/hooks/useAuth";
import { calculateDailyInterest, formatSavingsSummary } from "@shared/savings";

export default function WithdrawalPage() {
  const { user } = useAuth();
  const accountBalance = 12840.25;
  const annualRate = 0.12;
  const dailyYield = calculateDailyInterest(accountBalance, annualRate);

  const handleWithdrawal = () => {
    if (!user) {
      notify("Sign in to request a withdrawal from your crypto savings balance.", "info");
      return;
    }

    notify("Withdrawal request submitted for review. Your daily accrued interest is included in the balance before settlement.", "success");
  };

  return (
    <AppShell>
      <div className="page-shell feature-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Wallet</span>
              <span>/</span>
              <strong>Withdraw</strong>
            </div>
            <h1>Withdraw from savings</h1>
            <p>
              Your deposit earns daily interest automatically, so the value of your crypto savings balance grows every day until you withdraw.
            </p>
          </div>
          <Link href="/portfolio" className="button button-secondary button-sm">
            Back to portfolio
          </Link>
        </div>

        <div className="btc-summary-grid">
          <section className="section-card btc-balance-card">
            <span className="section-eyebrow">Savings balance</span>
            <strong>Ξ {accountBalance.toFixed(4)}</strong>
            <span>Available to withdraw</span>
          </section>

          <section className="section-card btc-balance-card">
            <span className="section-eyebrow">Daily yield</span>
            <strong>${dailyYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            <span>{(annualRate * 100).toFixed(2)}% annual yield • auto-added every day</span>
          </section>
        </div>

        <div className="btc-deposit-grid">
          <section className="section-card btc-address-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Savings note</span>
                <h2>How the interest works</h2>
              </div>
              <span className="network-chip positive">Daily accrual</span>
            </div>

            <div style={{ display: "grid", gap: "12px", color: "var(--muted)" }}>
              <p style={{ margin: 0 }}>
                {formatSavingsSummary(accountBalance, annualRate)}
              </p>
              <div className="wallet-meta-row">
                <span className="wallet-meta-pill"><TrendingUp size={14} /> Automatic yield</span>
                <span className="wallet-meta-pill"><ShieldCheck size={14} /> Secure settlement</span>
              </div>
            </div>
          </section>

          <section className="section-card btc-address-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Ready to move assets</span>
                <h2>Withdrawal request</h2>
              </div>
              <span className="network-chip">ETH savings</span>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <div className="wallet-empty-state">
                <div className="wallet-empty-icon"><Wallet2 size={26} /></div>
                <p>Requesting a withdrawal will review the current balance and the daily interest that has already accrued to your account.</p>
              </div>

              <Button type="button" onClick={handleWithdrawal} className="full-button">
                Request withdrawal <ArrowRight size={15} />
              </Button>

              {!user ? (
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "12px" }}>
                  Sign in to submit the withdrawal and verify the account that owns the savings position.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

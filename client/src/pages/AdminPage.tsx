import { AppShell } from "@/components/AppShell";
import { SupabaseAuthDialog } from "@/components/SupabaseAuthDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/_core/hooks/useAuth";
import { notify } from "@/lib/notify";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("100");
  const [mode, setMode] = useState<"credit" | "debit" | "set">("credit");
  const [reason, setReason] = useState("Admin top-up");

  const adminUsersQuery = trpc.admin.users.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
  });
  const adjustBalanceMutation = trpc.admin.adjustUserBalance.useMutation();
  const setUserRoleMutation = trpc.admin.setUserRole.useMutation();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/admin/login");
      return;
    }
  }, [authLoading, setLocation, user]);

  useEffect(() => {
    if (!adminUsersQuery.data || adminUsersQuery.data.length === 0) return;
    setSelectedUserId((current) => current || adminUsersQuery.data[0].openId);
  }, [adminUsersQuery.data]);

  const selectedUser = adminUsersQuery.data?.find((entry) => entry.openId === selectedUserId) ?? null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) return;

    try {
      const response = await adjustBalanceMutation.mutateAsync({
        userId: selectedUserId,
        amount,
        mode,
        reason: reason.trim() || "Admin wallet adjustment",
      });

      notify(`Wallet adjusted for ${selectedUser?.email ?? selectedUserId}. New balance: ${response.balance}`, "success");
      await adminUsersQuery.refetch();
      setAmount("100");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to adjust balance.";
      const friendlyMessage = message.includes("FORBIDDEN") || message.includes("Forbidden")
        ? "Admin access denied. Sign in with an approved administrator account to continue."
        : message;
      notify(friendlyMessage, "error");
    }
  };

  const handleRoleUpdate = async (nextRole: "user" | "admin") => {
    if (!selectedUserId) return;

    try {
      const result = await setUserRoleMutation.mutateAsync({ userId: selectedUserId, role: nextRole });
      notify(`User role updated to ${result.role}.`, "success");
      await adminUsersQuery.refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update user role.";
      const friendlyMessage = message.includes("FORBIDDEN") || message.includes("Forbidden")
        ? "Admin access denied. Sign in with an approved administrator account to continue."
        : message;
      notify(friendlyMessage, "error");
    }
  };

  const accessDenied = Boolean(user) && adminUsersQuery.isError;

  return <AppShell>
    <div className="page-shell feature-shell settings-shell">
      <div className="workspace-heading feature-heading">
        <div>
          <div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Admin</strong></div>
          <h1>Admin wallet control</h1>
          <p>Manage a single user wallet balance without exposing their login details.</p>
        </div>
      </div>

      {!user ? (
        <section className="section-card settings-auth-card">
          <h2>Sign in to access the admin panel</h2>
          <p>Your account must be authenticated before the admin tools are available.</p>
          <Button type="button" onClick={() => setAuthOpen(true)}>Sign in</Button>
        </section>
      ) : accessDenied ? (
        <section className="section-card settings-auth-card">
          <h2>Access denied</h2>
          <p>Your account does not have the admin role required to use the wallet controls.</p>
        </section>
      ) : adminUsersQuery.isLoading || authLoading ? (
        <section className="section-card settings-auth-card"><h2>Loading admin data</h2><p>Checking the wallet records and user list.</p></section>
      ) : (
        <div className="admin-layout">
          <section className="section-card admin-panel-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Accounts</span>
                <h2>Users</h2>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {adminUsersQuery.data?.map((entry) => (
                <button
                  key={entry.openId}
                  type="button"
                  onClick={() => setSelectedUserId(entry.openId)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: selectedUserId === entry.openId ? "1px solid #7dd3fc" : "1px solid rgba(148,163,184,0.2)",
                    background: selectedUserId === entry.openId ? "rgba(125, 211, 252, 0.08)" : "rgba(15,23,42,0.55)",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong>{entry.name ?? entry.email ?? entry.openId}</strong>
                    <span style={{ opacity: 0.75 }}>{entry.role}</span>
                  </div>
                  <div style={{ opacity: 0.8, fontSize: 12, marginTop: 4 }}>{entry.email ?? entry.openId}</div>
                  <div style={{ opacity: 0.8, fontSize: 12, marginTop: 4 }}>Balance: ${Number(entry.cashBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="section-card admin-panel-card">
            <div className="section-header">
              <div>
                <span className="section-eyebrow">Wallet action</span>
                <h2>Adjust balance</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <Label htmlFor="admin-user">User</Label>
                <select id="admin-user" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} style={{ padding: "10px 12px", borderRadius: 10, background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.25)" }}>
                  {adminUsersQuery.data?.map((entry) => (
                    <option key={entry.openId} value={entry.openId}>{entry.email ?? entry.name ?? entry.openId}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <Label htmlFor="admin-mode">Action</Label>
                <select id="admin-mode" value={mode} onChange={(event) => setMode(event.target.value as "credit" | "debit" | "set")} style={{ padding: "10px 12px", borderRadius: 10, background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.25)" }}>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                  <option value="set">Set value</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <Label htmlFor="admin-amount">Amount</Label>
                <Input id="admin-amount" type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100" />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <Label htmlFor="admin-reason">Reason</Label>
                <Input id="admin-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Admin top-up" />
              </div>

              <Button type="submit" disabled={adjustBalanceMutation.isPending}>
                {adjustBalanceMutation.isPending ? "Updating..." : `Apply ${mode}`}
              </Button>

              <div style={{ display: "grid", gap: 8, marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(148,163,184,0.2)" }}>
                <Label htmlFor="admin-role">Role</Label>
                <select id="admin-role" value={selectedUser?.role ?? "user"} onChange={(event) => void handleRoleUpdate(event.target.value as "user" | "admin")} style={{ padding: "10px 12px", borderRadius: 10, background: "#0f172a", color: "#e2e8f0", border: "1px solid rgba(148,163,184,0.25)" }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </form>
          </section>
        </div>
      )}

      <SupabaseAuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  </AppShell>;
}

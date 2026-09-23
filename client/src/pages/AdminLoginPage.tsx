import { AppShell } from "@/components/AppShell";
import { SupabaseAuthDialog } from "@/components/SupabaseAuthDialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function AdminLoginPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [authOpen, setAuthOpen] = useState(!user);

  const adminUsersQuery = trpc.admin.users.useQuery(undefined, {
    enabled: Boolean(user),
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && user && !adminUsersQuery.isLoading && adminUsersQuery.data) {
      setLocation("/admin");
    }
  }, [adminUsersQuery.data, adminUsersQuery.isLoading, authLoading, setLocation, user]);

  useEffect(() => {
    if (!authLoading) {
      setAuthOpen(!user);
    }
  }, [authLoading, user]);

  const isNotAdmin = Boolean(user) && adminUsersQuery.isError;

  return <AppShell>
    <div className="page-shell feature-shell settings-shell">
      <div className="workspace-heading feature-heading">
        <div>
          <div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Admin access</strong></div>
          <h1>Admin login</h1>
          <p>Use this dedicated sign-in flow for the staff dashboard.</p>
        </div>
      </div>

      {authLoading ? (
        <section className="section-card settings-auth-card">
          <h2>Checking admin access</h2>
          <p>Preparing the secure sign-in flow.</p>
        </section>
      ) : isNotAdmin ? (
        <section className="section-card settings-auth-card">
          <h2>Admin account required</h2>
          <p>This signed-in account is not authorized for the admin dashboard.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
            <Button type="button" onClick={() => void logout().then(() => setLocation("/admin/login"))}>Sign out</Button>
            <Button type="button" variant="outline" onClick={() => setAuthOpen(true)}>Use another admin account</Button>
          </div>
        </section>
      ) : !user ? (
        <section className="section-card settings-auth-card">
          <h2>Secure admin sign in</h2>
          <p>Only authorized staff accounts can continue to the admin dashboard.</p>
          <Button type="button" onClick={() => setAuthOpen(true)} style={{ marginTop: 16 }}>Open admin login</Button>
        </section>
      ) : (
        <section className="section-card settings-auth-card">
          <h2>Redirecting to dashboard</h2>
          <p>Checking your admin access and opening the control panel.</p>
        </section>
      )}

      <SupabaseAuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  </AppShell>;
}

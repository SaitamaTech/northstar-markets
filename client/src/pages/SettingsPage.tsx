import { Check, CircleUserRound, Mail, Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SupabaseAuthDialog } from "@/components/SupabaseAuthDialog";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";

export default function SettingsPage() {
  const { user, profile, refresh } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setDisplayName(profile?.display_name ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile]);

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error: profileError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: fullName.trim() || null,
      display_name: displayName.trim() || null,
      avatar_url: avatarUrl.trim() || null,
      email: user.email ?? null,
    }, { onConflict: "user_id" });
    if (profileError) {
      notify(`Unable to update profile: ${profileError.message}`);
      setSaving(false);
      return;
    }
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim(), display_name: displayName.trim(), avatar_url: avatarUrl.trim() },
    });
    setSaving(false);
    if (metadataError) {
      notify(`Profile saved, but account metadata could not be refreshed: ${metadataError.message}`);
      return;
    }
    await refresh();
    notify("Profile updated successfully.", "success");
  };

  return <AppShell><div className="page-shell feature-shell settings-shell">
    <div className="workspace-heading feature-heading"><div><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Settings</strong></div><h1>Profile settings</h1><p>Keep your Northstar identity and account details up to date.</p></div></div>
    {!user ? <section className="section-card settings-auth-card"><CircleUserRound size={32} /><h2>Sign in to manage your profile</h2><p>Your profile settings are private and available only to your authenticated account.</p><Button type="button" onClick={() => setAuthOpen(true)}>Sign in</Button></section> : <div className="settings-grid">
      <section className="section-card settings-profile-card"><div className="settings-card-heading"><div className="settings-avatar">{(displayName || fullName || user.email || "I").slice(0, 1).toUpperCase()}</div><div><span className="section-eyebrow">Personal profile</span><h2>Profile information</h2><p>These details appear across your market workspace.</p></div></div><form className="settings-form" onSubmit={saveProfile}><div className="settings-form-grid"><div className="auth-field"><Label htmlFor="profile-full-name">Full name</Label><Input id="profile-full-name" value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Your full name" /></div><div className="auth-field"><Label htmlFor="profile-display-name">Display name</Label><Input id="profile-display-name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="Name shown on the dashboard" /></div></div><div className="auth-field"><Label htmlFor="profile-avatar-url">Avatar URL</Label><Input id="profile-avatar-url" type="url" value={avatarUrl} onChange={event => setAvatarUrl(event.target.value)} placeholder="https://example.com/avatar.jpg" /></div><Button type="submit" disabled={saving}><Save size={15} /> {saving ? "Saving changes..." : "Save profile"}</Button></form></section>
      <aside className="settings-side"><section className="section-card settings-account-card"><span className="section-eyebrow">Account</span><h2>Login email</h2><div className="settings-email"><Mail size={16} /><span>{user.email}</span></div><small>Your email is managed securely by Supabase Authentication.</small></section><section className="section-card settings-account-card"><span className="section-eyebrow">Privacy</span><h2>Your profile is private</h2><p><ShieldCheck size={16} /> Only your authenticated account can read or update these profile details.</p><div className="settings-status"><Check size={14} /> Row-level security enabled</div></section></aside>
    </div>}
    <SupabaseAuthDialog open={authOpen} onOpenChange={setAuthOpen} />
  </div></AppShell>;
}

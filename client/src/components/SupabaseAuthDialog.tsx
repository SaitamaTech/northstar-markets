import { CheckCircle2, LockKeyhole, Mail, UserRound, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthRedirectTarget } from "@/lib/authSession";

interface SupabaseAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupabaseAuthDialog({ open, onOpenChange }: SupabaseAuthDialogProps) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [signupComplete, setSignupComplete] = useState(false);

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const signInWithGoogle = async () => {
    resetFeedback();
    setBusy(true);
    const redirectTo = getAuthRedirectTarget(window.location, "/dashboard");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (authError) {
      setError(authError.message);
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setBusy(true);
    const result = mode === "signIn"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: getAuthRedirectTarget(window.location, "/dashboard"), data: { full_name: fullName, display_name: fullName } } });

    if (result.error) {
      setError(result.error.message);
    } else if (mode === "signUp" && !result.data.session) {
      setSignupComplete(true);
    } else {
      onOpenChange(false);
    }
    setBusy(false);
  };

  const switchMode = () => {
    resetFeedback();
    setSignupComplete(false);
    setMode(current => current === "signIn" ? "signUp" : "signIn");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="auth-dialog">
        <button type="button" className="auth-dialog-close" aria-label="Close sign in" onClick={() => onOpenChange(false)}><X size={16} /></button>
        {signupComplete ? <div className="auth-confirmation">
          <span className="auth-confirmation-icon"><CheckCircle2 size={30} /></span>
          <DialogTitle>Account created</DialogTitle>
          <DialogDescription>We sent a confirmation link to <strong>{email}</strong>.</DialogDescription>
          <p>Confirm your email address to activate your Northstar Markets account. Once confirmed, return here and sign in.</p>
          <Button type="button" className="auth-submit" onClick={() => { setSignupComplete(false); setMode("signIn"); }}>Continue to sign in</Button>
        </div> : <>
        <div className="auth-dialog-header">
          <span className="auth-dialog-mark">N</span>
          <span className="auth-mode-label">{mode === "signIn" ? "ACCOUNT ACCESS" : "NEW ACCOUNT"}</span>
          <DialogTitle>{mode === "signIn" ? "Welcome back" : "Create your Northstar account"}</DialogTitle>
          <DialogDescription>{mode === "signIn" ? "Sign in to access your live market workspace." : "Set up your profile to personalize your market workspace."}</DialogDescription>
        </div>
        <Button type="button" variant="outline" className="auth-google-button" onClick={signInWithGoogle} disabled={busy}><span className="google-mark">G</span> {mode === "signIn" ? "Sign in with Google" : "Create account with Google"}</Button>
        <div className="auth-divider"><span>{mode === "signIn" ? "or sign in with email" : "or create with email"}</span></div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "signUp" && <div className="auth-field"><Label htmlFor="auth-name">Full name</Label><div className="auth-input-wrap"><UserRound size={15} /><Input id="auth-name" type="text" autoComplete="name" value={fullName} onChange={event => setFullName(event.target.value)} required placeholder="Your name" /></div></div>}
          <div className="auth-field"><Label htmlFor="auth-email">Email</Label><div className="auth-input-wrap"><Mail size={15} /><Input id="auth-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required placeholder="you@example.com" /></div></div>
          <div className="auth-field"><Label htmlFor="auth-password">Password</Label><div className="auth-input-wrap"><LockKeyhole size={15} /><Input id="auth-password" type="password" autoComplete={mode === "signIn" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} required minLength={6} placeholder="At least 6 characters" /></div></div>
          {error && <p className="auth-error" role="alert">{error}</p>}
          {message && <p className="auth-message" role="status">{message}</p>}
          <Button type="submit" className="auth-submit" disabled={busy}>{busy ? "Working..." : mode === "signIn" ? "Sign in" : "Create account"}</Button>
        </form>
        <p className="auth-switch">{mode === "signIn" ? "New to Northstar?" : "Already have an account?"} <button type="button" onClick={switchMode}>{mode === "signIn" ? "Create an account" : "Sign in"}</button></p>
        </>}
      </DialogContent>
    </Dialog>
  );
}

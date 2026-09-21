import { getAuthRedirectTarget } from "@/lib/authSession";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState } from "react";

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

function getMetadataName(metadata: Record<string, unknown>) {
  const value = metadata.display_name ?? metadata.full_name ?? metadata.name;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [user, setUser] = useState<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadProfile = async (currentUser: typeof user) => {
      if (!currentUser) {
        setProfile(null);
        return;
      }
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, display_name, avatar_url, email")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (profileError) {
        console.warn("[Supabase] Profile lookup failed:", profileError.message);
        return;
      }
      if (data) {
        setProfile(data as Profile);
        return;
      }
      const fallbackName = getMetadataName(currentUser.user_metadata ?? {});
      const { data: created, error: createError } = await supabase.from("profiles").upsert({
        user_id: currentUser.id,
        full_name: fallbackName,
        display_name: fallbackName,
        email: currentUser.email ?? null,
      }, { onConflict: "user_id" }).select("id, user_id, full_name, display_name, avatar_url, email").single();
      if (createError) {
        console.warn("[Supabase] Profile creation failed:", createError.message);
        return;
      }
      setProfile(created as Profile);
    };

    const syncSupabaseAuth = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const { data: userData, error: authError } = await supabase.auth.getUser();
        const resolvedUser = userData.user ?? sessionData.session?.user ?? null;

        setUser(resolvedUser);
        setError(authError ?? sessionError ?? null);
        await loadProfile(resolvedUser);
      } catch (caughtError) {
        console.warn("[Supabase] Auth sync failed:", caughtError);
        setUser(null);
        setError(caughtError as Error);
      } finally {
        setLoading(false);
      }
    };

    void syncSupabaseAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      void loadProfile(nextUser);
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    const { error: authError } = await supabase.auth.signOut();
    if (authError) throw authError;
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading || user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) window.location.href = redirectPath;
    else {
      const redirectTo = getAuthRedirectTarget(window.location);
      void supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    }
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    loading,
    user,
  ]);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    refresh: async () => {
      const { data, error: authError } = await supabase.auth.getUser();
      setUser(data.user);
      setError(authError);
      if (data.user) {
        const { data: currentProfile } = await supabase.from("profiles").select("id, user_id, full_name, display_name, avatar_url, email").eq("user_id", data.user.id).maybeSingle();
        setProfile((currentProfile as Profile | null) ?? null);
      } else {
        setProfile(null);
      }
    },
    logout,
    profile,
    displayName: profile?.display_name || profile?.full_name || getMetadataName(user?.user_metadata ?? {}) || user?.email?.split("@")[0] || (user ? "Investor" : null),
  };
}

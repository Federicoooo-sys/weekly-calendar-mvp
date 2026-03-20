"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, inviteCode: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, inviteCode: string, displayName: string) => {
    const supabase = createClient();

    // 1. Validate the invite code first (before creating the account)
    const { data: codeData } = await supabase
      .from("invite_codes")
      .select("code, redeemed_by")
      .eq("code", inviteCode.toUpperCase().trim())
      .single();

    if (!codeData) {
      return { error: "Invalid invite code." };
    }
    if (codeData.redeemed_by) {
      return { error: "This invite code has already been used." };
    }

    // 2. Create the auth account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Account creation failed. Please try again." };
    }

    // 3. Redeem the invite code atomically
    const { data: redeemed } = await supabase.rpc("redeem_invite_code", {
      invite_code: inviteCode.toUpperCase().trim(),
      claiming_user_id: authData.user.id,
    });

    if (!redeemed) {
      // Code was claimed between our check and redemption — rare but possible
      // The auth account was created, but we should inform the user
      return { error: "Invite code was just claimed by someone else. Your account was created — please contact the admin for a new code." };
    }

    // 4. Create initial preferences row
    await supabase.from("user_preferences").insert({
      user_id: authData.user.id,
      theme: "light",
      language: "en",
      week_start_day: "mon",
    });

    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signUp, signIn, signOut }),
    [user, loading, signUp, signIn, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

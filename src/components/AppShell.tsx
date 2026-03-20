"use client";

import { useAuth } from "@/hooks/useAuth";
import { useNotificationCount } from "@/hooks/useNotifications";
import { PreferencesProvider } from "@/hooks/usePreferences";
import AuthPage from "./AuthPage";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { count: unreadCount } = useNotificationCount();

  // Loading state — show nothing to avoid flash
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <div
          className="w-6 h-6 rounded-full animate-pulse"
          style={{ background: "var(--color-accent)" }}
        />
      </div>
    );
  }

  // Not authenticated — show sign in / sign up
  if (!user) {
    return <AuthPage />;
  }

  // Authenticated — show the app
  return (
    <PreferencesProvider>
      <Sidebar unreadCount={unreadCount} />
      <main className="min-h-screen pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0 md:pl-56">
        {children}
      </main>
      <BottomNav unreadCount={unreadCount} />
    </PreferencesProvider>
  );
}

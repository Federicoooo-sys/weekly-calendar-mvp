"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { fetchProfileMap } from "@/lib/profiles";
import { useAuth } from "./useAuth";
import type { Notification } from "@/types";

/** Lightweight hook — just the unread count, for nav indicators. */
export function useNotificationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setCount(0); return; }
    const supabase = createClient();
    const { count: c } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setCount(c || 0);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { count, refresh };
}

/** Full notifications hook — list, mark read, count. */
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!data || data.length === 0) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    // Fetch actor display names
    const actorIds = data.map((n) => n.actor_id);
    const profileMap = await fetchProfileMap(actorIds);

    const mapped: Notification[] = data.map((n) => ({
      id: n.id,
      userId: n.user_id,
      actorId: n.actor_id,
      type: n.type,
      targetId: n.target_id || undefined,
      targetLabel: n.target_label,
      read: n.read,
      createdAt: n.created_at,
      actorName: profileMap.get(n.actor_id) || "",
    }));

    setNotifications(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, markAllRead, reload: load };
}

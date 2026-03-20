"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { getCurrentWeekStart } from "@/lib/dates";
import type { CalendarEvent, DayOfWeek, EventCategory, EventVisibility } from "@/types";

/** Maps a DB row to CalendarEvent, stripping private fields (note). */
function rowToSharedEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    dayKey: row.day_key as DayOfWeek,
    startTime: (row.start_time as string) || undefined,
    endTime: (row.end_time as string) || undefined,
    category: row.category as EventCategory,
    status: row.status as CalendarEvent["status"],
    visibility: (row.visibility as EventVisibility) || "circle",
    // Note intentionally omitted — private by design
    createdAt: row.created_at as string,
  };
}

export function useSharedEvents(targetUserId: string | null) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !targetUserId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const weekStart = getCurrentWeekStart();

    // Fetch shared events for this user's current week.
    // RLS ensures we only get events where visibility='circle'
    // and we share a circle with the target user.
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", targetUserId)
      .eq("week_start", weekStart)
      .eq("visibility", "circle")
      .order("created_at", { ascending: true });

    setEvents((data || []).map(rowToSharedEvent));

    // Fetch display name
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", targetUserId)
      .single();

    setMemberName(profile?.display_name || "");
    setLoading(false);
  }, [user, targetUserId]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, memberName, loading, reload: load };
}

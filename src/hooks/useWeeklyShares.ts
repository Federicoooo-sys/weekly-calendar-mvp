"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { fetchProfileMap } from "@/lib/profiles";
import { notifyMany } from "@/lib/notify";
import { useAuth } from "./useAuth";
import type { SharedWeeklySummary } from "@/types";
import type { WeekSummary } from "@/lib/history";

export function useWeeklyShares(circleIds: string[]) {
  const { user } = useAuth();
  const [shares, setShares] = useState<SharedWeeklySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || circleIds.length === 0) {
      setShares([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("weekly_shares")
      .select("*")
      .in("circle_id", circleIds)
      .order("shared_at", { ascending: false })
      .limit(20);

    if (!data || data.length === 0) {
      setShares([]);
      setLoading(false);
      return;
    }

    // Fetch display names
    const userIds = data.map((s) => s.user_id);
    const profileMap = await fetchProfileMap(userIds);

    setShares(
      data.map((s) => ({
        id: s.id,
        userId: s.user_id,
        circleId: s.circle_id,
        weekStart: s.week_start,
        reflectionNote: s.reflection_note || undefined,
        totalEvents: s.total_events,
        completedEvents: s.completed_events,
        skippedEvents: s.skipped_events,
        completionRate: s.completion_rate,
        sharedAt: s.shared_at,
        displayName: profileMap.get(s.user_id) || "",
      }))
    );
    setLoading(false);
  }, [user, circleIds]);

  useEffect(() => { load(); }, [load]);

  /** Share a past week with a circle. */
  const shareWeek = useCallback(
    async (params: {
      circleId: string;
      weekStart: string;
      summary: WeekSummary;
      reflectionNote?: string;
      circleMemberIds: string[];
    }): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not authenticated" };

      const supabase = createClient();
      const { error } = await supabase.from("weekly_shares").insert({
        user_id: user.id,
        circle_id: params.circleId,
        week_start: params.weekStart,
        reflection_note: params.reflectionNote?.trim() || null,
        total_events: params.summary.total,
        completed_events: params.summary.completed,
        skipped_events: params.summary.skipped,
        completion_rate: params.summary.completionRate,
      });

      if (error) {
        if (error.code === "23505") {
          return { error: "Already shared with this circle" };
        }
        return { error: error.message };
      }

      // Notify circle members
      await notifyMany({
        userIds: params.circleMemberIds,
        actorId: user.id,
        type: "summary_shared",
        targetLabel: params.weekStart,
      });

      await load();
      return { error: null };
    },
    [user, load]
  );

  /** Check if a week was already shared with a circle. */
  const isShared = useCallback(
    (weekStart: string, circleId: string): boolean => {
      return shares.some(
        (s) => s.weekStart === weekStart && s.circleId === circleId && s.userId === user?.id
      );
    },
    [shares, user]
  );

  return { shares, loading, shareWeek, isShared, reload: load };
}

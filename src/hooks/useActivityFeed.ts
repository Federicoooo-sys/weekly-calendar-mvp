"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { FeedItem, SharedWeeklySummary } from "@/types";

/**
 * Derives an activity feed from weekly_shares + recent circle_members joins.
 * Deliberately excludes comment/reaction activity — too granular, per guardrails.
 */
export function useActivityFeed(circleIds: string[]) {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || circleIds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const feedItems: FeedItem[] = [];

    // 1. Weekly shares (most recent 10)
    const { data: sharesData } = await supabase
      .from("weekly_shares")
      .select("*")
      .in("circle_id", circleIds)
      .order("shared_at", { ascending: false })
      .limit(10);

    // 2. Recent member joins (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: membersData } = await supabase
      .from("circle_members")
      .select("*")
      .in("circle_id", circleIds)
      .gte("joined_at", thirtyDaysAgo.toISOString())
      .order("joined_at", { ascending: false });

    // Collect all user IDs for profile lookup
    const allUserIds = new Set<string>();
    (sharesData || []).forEach((s) => allUserIds.add(s.user_id));
    (membersData || []).forEach((m) => allUserIds.add(m.user_id));

    // Batch fetch profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", [...allUserIds]);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p.display_name || ""])
    );

    // Get circle names
    const { data: circles } = await supabase
      .from("circles")
      .select("id, name")
      .in("id", circleIds);

    const circleMap = new Map(
      (circles || []).map((c) => [c.id, c.name])
    );

    // Build share feed items
    for (const s of sharesData || []) {
      const summary: SharedWeeklySummary = {
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
      };

      feedItems.push({
        id: `share-${s.id}`,
        type: "summary_shared",
        actorName: profileMap.get(s.user_id) || "",
        timestamp: s.shared_at,
        summary,
      });
    }

    // Build member join feed items (exclude self)
    for (const m of membersData || []) {
      if (m.user_id === user.id) continue;
      feedItems.push({
        id: `join-${m.id}`,
        type: "member_joined",
        actorName: profileMap.get(m.user_id) || "",
        timestamp: m.joined_at,
        circleName: circleMap.get(m.circle_id) || "",
      });
    }

    // Sort by timestamp desc, cap at 10
    feedItems.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    setItems(feedItems.slice(0, 10));
    setLoading(false);
  }, [user, circleIds]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, reload: load };
}

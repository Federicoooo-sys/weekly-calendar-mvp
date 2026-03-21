"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "./useAuth";

export interface ParticipantAvatar {
  userId: string;
  displayName: string;
}

/**
 * Batch-loads accepted participants for a set of event IDs.
 * Returns a map of eventId → ParticipantAvatar[].
 * Only loads for circle-visibility events to minimize queries.
 */
export function useEventParticipantAvatars(eventIds: string[]) {
  const { user } = useAuth();
  const [avatarMap, setAvatarMap] = useState<Record<string, ParticipantAvatar[]>>({});

  useEffect(() => {
    if (!user || eventIds.length === 0) {
      setAvatarMap({});
      return;
    }

    let cancelled = false;

    async function load() {
      const supabase = createClient();

      // Get accepted participants for these events
      const { data: participants } = await supabase
        .from("event_participants")
        .select("event_id, user_id, status")
        .in("event_id", eventIds)
        .eq("status", "accepted");

      if (cancelled || !participants || participants.length === 0) {
        if (!cancelled) setAvatarMap({});
        return;
      }

      // Get display names
      const userIds = [...new Set(participants.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      if (cancelled) return;

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p.display_name || ""])
      );

      // Group by event
      const map: Record<string, ParticipantAvatar[]> = {};
      for (const p of participants) {
        if (!map[p.event_id]) map[p.event_id] = [];
        map[p.event_id].push({
          userId: p.user_id,
          displayName: profileMap.get(p.user_id) || "",
        });
      }

      setAvatarMap(map);
    }

    load();
    return () => { cancelled = true; };
  }, [user, eventIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  return avatarMap;
}

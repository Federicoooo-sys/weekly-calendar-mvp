"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { useAuth } from "./useAuth";
import type { Reaction, ReactionEmoji } from "@/types";

interface ReactionCounts {
  "👍": number;
  "❤️": number;
  "👏": number;
  "🔥": number;
}

export function useReactions(
  eventId: string | null,
  eventMeta?: { ownerId?: string; title?: string }
) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!eventId || !user) {
      setReactions([]);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("reactions")
      .select("*")
      .eq("event_id", eventId);

    if (data) {
      // Fetch display names
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p.display_name || ""])
      );

      setReactions(
        data.map((r) => ({
          id: r.id,
          eventId: r.event_id,
          userId: r.user_id,
          emoji: r.emoji as ReactionEmoji,
          createdAt: r.created_at,
          displayName: profileMap.get(r.user_id) || "",
        }))
      );
    }
    setLoading(false);
  }, [eventId, user]);

  useEffect(() => { load(); }, [load]);

  /** Toggle a reaction. If user already reacted with this emoji, remove it. If different emoji, switch. If none, add. */
  const toggleReaction = useCallback(
    async (emoji: ReactionEmoji) => {
      if (!user || !eventId) return;

      const existing = reactions.find((r) => r.userId === user.id);
      const supabase = createClient();

      if (existing && existing.emoji === emoji) {
        // Remove reaction
        await supabase.from("reactions").delete().eq("id", existing.id);
        setReactions((prev) => prev.filter((r) => r.id !== existing.id));
      } else if (existing) {
        // Change emoji
        await supabase.from("reactions").update({ emoji }).eq("id", existing.id);
        setReactions((prev) =>
          prev.map((r) => (r.id === existing.id ? { ...r, emoji } : r))
        );
      } else {
        // Add new reaction
        const { data } = await supabase
          .from("reactions")
          .insert({ event_id: eventId, user_id: user.id, emoji })
          .select()
          .single();

        if (data) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .single();

          setReactions((prev) => [
            ...prev,
            {
              id: data.id,
              eventId: data.event_id,
              userId: data.user_id,
              emoji: data.emoji as ReactionEmoji,
              createdAt: data.created_at,
              displayName: profile?.display_name || "",
            },
          ]);

          // Notify event owner
          if (eventMeta?.ownerId) {
            notify({
              userId: eventMeta.ownerId,
              actorId: user.id,
              type: "reaction",
              targetId: eventId,
              targetLabel: eventMeta.title || "",
            });
          }
        }
      }
    },
    [user, eventId, reactions, eventMeta]
  );

  // Compute counts
  const counts: ReactionCounts = { "👍": 0, "❤️": 0, "👏": 0, "🔥": 0 };
  for (const r of reactions) {
    if (r.emoji in counts) counts[r.emoji]++;
  }

  const userReaction = reactions.find((r) => r.userId === user?.id)?.emoji || null;

  return { reactions, counts, userReaction, loading, toggleReaction };
}

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { fetchProfileMap } from "@/lib/profiles";
import { notify, notifyMany } from "@/lib/notify";
import { useAuth } from "./useAuth";
import type { ChatMessage } from "@/types";

/** Deterministic DM pair key — sorted so order doesn't matter. */
function dmPairKey(a: string, b: string): string {
  return [a, b].sort().join("_");
}

interface UseChatOptions {
  circleId: string;
  /** Set to the other user's ID for DM mode. Omit for group chat. */
  dmUserId?: string;
  /** Circle name — used in group chat notifications. */
  circleName?: string;
  /** Member IDs — used for group chat notifications. */
  memberIds?: string[];
}

export function useChat({ circleId, dmUserId, circleName, memberIds }: UseChatOptions) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const dmPair = dmUserId && user ? dmPairKey(user.id, dmUserId) : null;
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!user || !circleId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("circle_id", circleId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (dmPair) {
      query = query.eq("dm_pair", dmPair);
    } else {
      query = query.is("dm_pair", null);
    }

    const { data } = await query;

    if (!data || data.length === 0) {
      setMessages([]);
      setLoading(false);
      loadedRef.current = true;
      return;
    }

    // Fetch sender display names
    const senderIds = data.map((m) => m.sender_id);
    const profileMap = await fetchProfileMap(senderIds);

    const mapped: ChatMessage[] = data.map((m) => ({
      id: m.id,
      circleId: m.circle_id,
      senderId: m.sender_id,
      dmPair: m.dm_pair || null,
      content: m.content,
      createdAt: m.created_at,
      senderName: profileMap.get(m.sender_id) || "",
    }));

    setMessages(mapped);
    setLoading(false);
    loadedRef.current = true;
  }, [user, circleId, dmPair]);

  useEffect(() => {
    loadedRef.current = false;
    load();
  }, [load]);

  const send = useCallback(
    async (content: string): Promise<{ error: string | null }> => {
      if (!user || !circleId) return { error: "Not authenticated" };
      const trimmed = content.trim();
      if (!trimmed) return { error: null };

      const supabase = createClient();
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          circle_id: circleId,
          sender_id: user.id,
          dm_pair: dmPair,
          content: trimmed,
        })
        .select()
        .single();

      if (error) return { error: error.message };

      // Optimistically add to local state
      if (data) {
        // Get sender name from existing messages or profile
        const existingSender = messages.find((m) => m.senderId === user.id);
        const newMsg: ChatMessage = {
          id: data.id,
          circleId: data.circle_id,
          senderId: data.sender_id,
          dmPair: data.dm_pair || null,
          content: data.content,
          createdAt: data.created_at,
          senderName: existingSender?.senderName || "",
        };
        setMessages((prev) => [...prev, newMsg]);
      }

      // Send notifications
      const preview = trimmed.length > 40 ? trimmed.slice(0, 40) + "..." : trimmed;
      if (dmPair && dmUserId) {
        // DM notification
        await notify({
          userId: dmUserId,
          actorId: user.id,
          type: "chat_dm",
          targetId: circleId,
          targetLabel: preview,
        });
      } else if (memberIds && memberIds.length > 0) {
        // Group chat notification
        await notifyMany({
          userIds: memberIds,
          actorId: user.id,
          type: "chat_group",
          targetId: circleId,
          targetLabel: circleName || preview,
        });
      }

      return { error: null };
    },
    [user, circleId, dmPair, dmUserId, memberIds, circleName, messages],
  );

  return { messages, loading, send, reload: load };
}

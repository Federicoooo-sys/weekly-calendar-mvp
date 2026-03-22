"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { fetchProfileMap, fetchDisplayName } from "@/lib/profiles";
import { notify } from "@/lib/notify";
import { useAuth } from "./useAuth";
import type { Comment } from "@/types";

export function useComments(
  eventId: string | null,
  eventMeta?: { ownerId?: string; title?: string }
) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const loadComments = useCallback(async () => {
    if (!eventId || !user) {
      setComments([]);
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Fetch comments for this event
    const { data: commentsData } = await supabase
      .from("comments")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    // Fetch display names for comment authors
    const userIds = commentsData.map((c) => c.user_id);
    const profileMap = await fetchProfileMap(userIds);

    const mapped: Comment[] = commentsData.map((c) => ({
      id: c.id,
      eventId: c.event_id,
      userId: c.user_id,
      content: c.content,
      createdAt: c.created_at,
      displayName: profileMap.get(c.user_id) || "",
    }));

    setComments(mapped);
    setLoading(false);
  }, [eventId, user]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const addComment = useCallback(
    async (content: string): Promise<{ error: string | null }> => {
      if (!user || !eventId) return { error: "Not authenticated" };
      if (!content.trim()) return { error: "Comment cannot be empty" };

      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .insert({
          event_id: eventId,
          user_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) return { error: error.message };

      if (data) {
        const displayName = await fetchDisplayName(user.id);

        const newComment: Comment = {
          id: data.id,
          eventId: data.event_id,
          userId: data.user_id,
          content: data.content,
          createdAt: data.created_at,
          displayName,
        };
        setComments((prev) => [...prev, newComment]);
      }

      // Notify event owner
      if (eventMeta?.ownerId) {
        notify({
          userId: eventMeta.ownerId,
          actorId: user.id,
          type: "comment",
          targetId: eventId,
          targetLabel: eventMeta.title || "",
        });
      }

      return { error: null };
    },
    [user, eventId, eventMeta]
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not authenticated" };

      const supabase = createClient();
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) return { error: error.message };
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      return { error: null };
    },
    [user]
  );

  return { comments, loading, addComment, deleteComment, reload: loadComments };
}

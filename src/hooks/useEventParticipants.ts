"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { fetchProfileMap } from "@/lib/profiles";
import { notify } from "@/lib/notify";
import { useAuth } from "./useAuth";
import type { EventParticipant } from "@/types";

function rowToParticipant(row: Record<string, unknown>, displayName?: string): EventParticipant {
  return {
    id: row.id as string,
    eventId: row.event_id as string,
    userId: row.user_id as string,
    role: row.role as EventParticipant["role"],
    status: row.status as EventParticipant["status"],
    invitedBy: (row.invited_by as string) || undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    displayName,
  };
}

/**
 * Manages participants for a single event.
 * Handles invite, ask-to-join, accept, decline flows.
 */
export function useEventParticipants(eventId: string | null) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !eventId) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("event_participants")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (!data || data.length === 0) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    // Fetch display names
    const userIds = data.map((r) => r.user_id);
    const profileMap = await fetchProfileMap(userIds);

    setParticipants(
      data.map((r) => rowToParticipant(r, profileMap.get(r.user_id)))
    );
    setLoading(false);
  }, [user, eventId]);

  useEffect(() => { load(); }, [load]);

  /** Invite a circle member to this event. */
  const inviteUser = useCallback(
    async (targetUserId: string, eventTitle: string): Promise<{ error: string | null }> => {
      if (!user || !eventId) return { error: "Not authenticated" };

      const supabase = createClient();
      const { error } = await supabase.from("event_participants").insert({
        event_id: eventId,
        user_id: targetUserId,
        role: "invite",
        status: "invited",
        invited_by: user.id,
      });

      if (error) {
        if (error.code === "23505") return { error: "Already invited" };
        return { error: error.message };
      }

      await notify({
        userId: targetUserId,
        actorId: user.id,
        type: "event_invite",
        targetId: eventId,
        targetLabel: eventTitle,
      });

      await load();
      return { error: null };
    },
    [user, eventId, load]
  );

  /** Ask to join someone else's shared event. */
  const requestToJoin = useCallback(
    async (eventOwnerId: string, eventTitle: string): Promise<{ error: string | null }> => {
      if (!user || !eventId) return { error: "Not authenticated" };

      const supabase = createClient();
      const { error } = await supabase.from("event_participants").insert({
        event_id: eventId,
        user_id: user.id,
        role: "request",
        status: "requested",
      });

      if (error) {
        if (error.code === "23505") return { error: "Already requested" };
        return { error: error.message };
      }

      await notify({
        userId: eventOwnerId,
        actorId: user.id,
        type: "join_request",
        targetId: eventId,
        targetLabel: eventTitle,
      });

      await load();
      return { error: null };
    },
    [user, eventId, load]
  );

  /** Accept or decline a participant (invite or request). */
  const respond = useCallback(
    async (
      participantId: string,
      newStatus: "accepted" | "declined",
      meta: { actorName: string; eventTitle: string; notifyUserId: string }
    ): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not authenticated" };

      const supabase = createClient();
      const { error } = await supabase
        .from("event_participants")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", participantId);

      if (error) return { error: error.message };

      // Notify the other party
      const label = newStatus === "accepted"
        ? `Accepted: ${meta.eventTitle}`
        : `Declined: ${meta.eventTitle}`;

      await notify({
        userId: meta.notifyUserId,
        actorId: user.id,
        type: "participant_response",
        targetId: eventId || undefined,
        targetLabel: label,
      });

      await load();
      return { error: null };
    },
    [user, eventId, load]
  );

  // Derived state
  const myParticipation = participants.find((p) => p.userId === user?.id);
  const accepted = participants.filter((p) => p.status === "accepted");
  const pending = participants.filter((p) => p.status === "invited" || p.status === "requested");

  return {
    participants,
    myParticipation,
    accepted,
    pending,
    loading,
    inviteUser,
    requestToJoin,
    respond,
    reload: load,
  };
}

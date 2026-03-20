"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { CircleWithMembers } from "@/types";

/** Generates a circle invite code: CIR-XXXX-XXXX */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `CIR-${seg()}-${seg()}`;
}

export function useCircle() {
  const { user } = useAuth();
  const [circles, setCircles] = useState<CircleWithMembers[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's circles with members
  const loadCircles = useCallback(async () => {
    if (!user) {
      setCircles([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // 1. Get circle IDs the user belongs to
    const { data: memberships } = await supabase
      .from("circle_members")
      .select("circle_id")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      setCircles([]);
      setLoading(false);
      return;
    }

    const circleIds = memberships.map((m) => m.circle_id);

    // 2. Get circle details
    const { data: circlesData } = await supabase
      .from("circles")
      .select("*")
      .in("id", circleIds);

    if (!circlesData) {
      setCircles([]);
      setLoading(false);
      return;
    }

    // 3. Get all members for these circles
    const { data: allMembers } = await supabase
      .from("circle_members")
      .select("*")
      .in("circle_id", circleIds);

    // 4. Get profiles for all unique users
    const userIds = [...new Set((allMembers || []).map((m) => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p.display_name || ""])
    );

    // 5. Assemble CircleWithMembers
    const result: CircleWithMembers[] = circlesData.map((c) => ({
      id: c.id,
      name: c.name,
      ownerId: c.owner_id,
      createdAt: c.created_at,
      members: (allMembers || [])
        .filter((m) => m.circle_id === c.id)
        .map((m) => ({
          circleId: m.circle_id,
          userId: m.user_id,
          role: m.role,
          joinedAt: m.joined_at,
          displayName: profileMap.get(m.user_id) || "",
        })),
    }));

    setCircles(result);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadCircles();
  }, [loadCircles]);

  /** Create a new circle and add self as owner. */
  const createCircle = useCallback(
    async (name: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not authenticated" };

      const supabase = createClient();

      // Insert circle
      const { data: circle, error: circleError } = await supabase
        .from("circles")
        .insert({ name: name.trim(), owner_id: user.id })
        .select()
        .single();

      if (circleError || !circle) {
        return { error: circleError?.message || "Failed to create circle" };
      }

      // Add self as owner member
      const { error: memberError } = await supabase
        .from("circle_members")
        .insert({ circle_id: circle.id, user_id: user.id, role: "owner" });

      if (memberError) {
        return { error: memberError.message };
      }

      await loadCircles();
      return { error: null };
    },
    [user, loadCircles]
  );

  /** Join a circle by invite code. */
  const joinCircle = useCallback(
    async (code: string): Promise<{ error: string | null; circleName?: string }> => {
      if (!user) return { error: "Not authenticated" };

      const supabase = createClient();
      const { data, error } = await supabase.rpc("join_circle_by_code", {
        invite_code: code.toUpperCase().trim(),
      });

      if (error) return { error: error.message };
      if (data?.error) return { error: data.error };

      await loadCircles();
      return { error: null, circleName: data?.circle_name };
    },
    [user, loadCircles]
  );

  /** Generate an invite code for a circle. */
  const generateInvite = useCallback(
    async (circleId: string): Promise<{ error: string | null; code?: string }> => {
      if (!user) return { error: "Not authenticated" };

      const code = generateCode();
      const supabase = createClient();

      const { error } = await supabase
        .from("circle_invites")
        .insert({
          circle_id: circleId,
          invited_by: user.id,
          code,
        });

      if (error) return { error: error.message };
      return { error: null, code };
    },
    [user]
  );

  /** Leave a circle. */
  const leaveCircle = useCallback(
    async (circleId: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not authenticated" };

      const supabase = createClient();
      const { error } = await supabase
        .from("circle_members")
        .delete()
        .eq("circle_id", circleId)
        .eq("user_id", user.id);

      if (error) return { error: error.message };
      await loadCircles();
      return { error: null };
    },
    [user, loadCircles]
  );

  /** Delete a circle (owner only). */
  const deleteCircle = useCallback(
    async (circleId: string): Promise<{ error: string | null }> => {
      if (!user) return { error: "Not authenticated" };

      const supabase = createClient();
      const { error } = await supabase
        .from("circles")
        .delete()
        .eq("id", circleId)
        .eq("owner_id", user.id);

      if (error) return { error: error.message };
      await loadCircles();
      return { error: null };
    },
    [user, loadCircles]
  );

  return {
    circles,
    loading,
    createCircle,
    joinCircle,
    generateInvite,
    leaveCircle,
    deleteCircle,
    reload: loadCircles,
  };
}

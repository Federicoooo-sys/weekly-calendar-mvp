import { createClient } from "@/lib/supabase";

/**
 * Fetch display names for a list of user IDs.
 * Returns a Map<userId, displayName>. Missing profiles return "".
 */
export async function fetchProfileMap(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();

  const unique = [...new Set(userIds)];
  const supabase = createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", unique);

  return new Map(
    (profiles || []).map((p) => [p.id, p.display_name || ""])
  );
}

/**
 * Fetch a single user's display name. Returns "" if not found.
 */
export async function fetchDisplayName(userId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .single();
  return data?.display_name || "";
}

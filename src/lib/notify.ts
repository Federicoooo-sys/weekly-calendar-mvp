import { createClient } from "./supabase";
import type { NotificationType } from "@/types";

/** Creates a notification for a single user. Skips self-notifications. */
export async function notify(params: {
  userId: string;
  actorId: string;
  type: NotificationType;
  targetId?: string;
  targetLabel: string;
}): Promise<void> {
  if (params.userId === params.actorId) return;

  const supabase = createClient();
  await supabase.from("notifications").insert({
    user_id: params.userId,
    actor_id: params.actorId,
    type: params.type,
    target_id: params.targetId || null,
    target_label: params.targetLabel,
  });
}

/** Creates notifications for multiple users. Filters out self. */
export async function notifyMany(params: {
  userIds: string[];
  actorId: string;
  type: NotificationType;
  targetId?: string;
  targetLabel: string;
}): Promise<void> {
  const recipients = params.userIds.filter((id) => id !== params.actorId);
  if (recipients.length === 0) return;

  const supabase = createClient();
  await supabase.from("notifications").insert(
    recipients.map((userId) => ({
      user_id: userId,
      actor_id: params.actorId,
      type: params.type,
      target_id: params.targetId || null,
      target_label: params.targetLabel,
    }))
  );
}

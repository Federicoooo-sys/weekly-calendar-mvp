"use client";

import { useReactions } from "@/hooks/useReactions";
import { REACTION_EMOJIS, type ReactionEmoji } from "@/types";

interface ReactionBarProps {
  eventId: string;
  eventOwnerId?: string;
  eventTitle?: string;
}

export default function ReactionBar({ eventId, eventOwnerId, eventTitle }: ReactionBarProps) {
  const { counts, userReaction, toggleReaction } = useReactions(eventId, {
    ownerId: eventOwnerId,
    title: eventTitle,
  });

  return (
    <div className="flex items-center gap-1.5">
      {REACTION_EMOJIS.map((emoji: ReactionEmoji) => {
        const count = counts[emoji];
        const isSelected = userReaction === emoji;
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors"
            style={{
              background: isSelected ? "var(--color-bg-tertiary)" : "transparent",
              border: isSelected
                ? "1px solid var(--color-accent)"
                : "1px solid var(--color-border)",
              opacity: count > 0 || isSelected ? 1 : 0.5,
            }}
          >
            <span className="text-sm">{emoji}</span>
            {count > 0 && (
              <span
                className="text-[10px] font-medium"
                style={{ color: isSelected ? "var(--color-accent)" : "var(--color-text-muted)" }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import PageShell from "@/components/PageShell";
import { usePreferences } from "@/hooks/usePreferences";

export default function CirclePage() {
  const { t } = usePreferences();

  return (
    <PageShell title={t.circlePageTitle}>
      <div className="mt-8 flex flex-col items-center text-center max-w-sm mx-auto">
        {/* Icon — two overlapping circles, representing connection */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--color-bg-tertiary)" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--color-text-muted)" }}
          >
            <circle cx="9" cy="12" r="6" />
            <circle cx="15" cy="12" r="6" />
          </svg>
        </div>

        <h3
          className="text-base font-semibold mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t.circleEmptyTitle}
        </h3>

        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {t.circleEmptyDescription}
        </p>

        <span
          className="text-xs font-medium px-3 py-1.5 rounded-full"
          style={{
            background: "var(--color-bg-tertiary)",
            color: "var(--color-text-muted)",
          }}
        >
          {t.circleComingSoon}
        </span>
      </div>
    </PageShell>
  );
}

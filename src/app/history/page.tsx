import PageShell from "@/components/PageShell";
import { strings } from "@/constants/strings";

export default function HistoryPage() {
  return (
    <PageShell title={strings.historyPageTitle}>
      <div className="mt-8 flex flex-col items-center text-center max-w-sm mx-auto">
        {/* Clock icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: "var(--color-bg-tertiary)" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--color-text-muted)" }}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {strings.historyDescription}
        </p>
      </div>
    </PageShell>
  );
}

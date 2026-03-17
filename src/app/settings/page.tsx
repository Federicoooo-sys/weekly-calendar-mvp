import PageShell from "@/components/PageShell";
import { strings } from "@/constants/strings";

export default function SettingsPage() {
  return (
    <PageShell title={strings.settingsPageTitle}>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-secondary)" }}>
        {strings.settingsDescription}
      </p>

      {/* Placeholder setting rows — show what will exist, not interactive yet */}
      <div className="space-y-3 max-w-md">
        <SettingRow label={strings.settingsTheme} value="Light" />
        <SettingRow label={strings.settingsLanguage} value="English" />
      </div>
    </PageShell>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-lg"
      style={{ background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)" }}
    >
      <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        {value}
      </span>
    </div>
  );
}

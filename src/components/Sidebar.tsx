"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { strings } from "@/constants/strings";
import { formatShortDate } from "@/lib/dates";

interface NavItem {
  href: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/", label: strings.navWeek },
  { href: "/history", label: strings.navHistory },
  { href: "/settings", label: strings.navSettings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const todayLabel = formatShortDate(new Date());

  return (
    <aside
      className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r"
      style={{ borderColor: "var(--color-border)", background: "var(--color-bg-secondary)" }}
    >
      <div className="flex flex-col h-full">
        {/* App name + today's date */}
        <div className="px-5 pt-5 pb-4">
          <h1 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {strings.appName}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            {todayLabel}
          </p>
        </div>

        <div className="mx-4 mb-2" style={{ borderTop: "1px solid var(--color-border)" }} />

        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
                  background: isActive ? "var(--color-bg-tertiary)" : "transparent",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

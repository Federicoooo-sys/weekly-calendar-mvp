interface PageShellProps {
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export default function PageShell({ title, children, fullWidth }: PageShellProps) {
  return (
    <div className={`px-4 py-4 md:px-6 md:py-6 ${fullWidth ? "" : "max-w-5xl"}`}>
      <h2
        className="text-lg font-semibold mb-6 md:text-xl"
        style={{ color: "var(--color-text-primary)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

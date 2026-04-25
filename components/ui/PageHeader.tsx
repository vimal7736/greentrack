import type { ReactNode } from "react";

interface PageHeaderProps {
  icon:       ReactNode;
  title:      string;
  subtitle:   ReactNode;
  right?:     ReactNode;
}

export function PageHeader({ icon, title, subtitle, right }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span style={{ color: "var(--brand-green)" }}>{icon}</span>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
        </div>
        <p className="text-sm font-bold opacity-60" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}

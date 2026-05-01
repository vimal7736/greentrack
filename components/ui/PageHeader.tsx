import type { ReactNode } from "react";

interface PageHeaderProps {
  icon:       ReactNode;
  title:      string;
  subtitle:   ReactNode;
  right?:     ReactNode;
}

export function PageHeader({ icon, title, subtitle, right }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="shrink-0" style={{ color: "var(--brand-green)" }}>{icon}</span>
          <h1 className="text-base lg:text-2xl font-black tracking-tight truncate" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
        </div>
        <p className="text-xs lg:text-sm font-bold opacity-60" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      </div>
      {right && (
        <div className="flex items-center gap-2 lg:gap-3 shrink-0 flex-wrap justify-end">
          {right}
        </div>
      )}
    </div>
  );
}

import type { ReactNode } from "react";

interface PageHeaderProps {
  icon:       ReactNode;
  title:      string;
  subtitle:   ReactNode;
  right?:     ReactNode;
}

export function PageHeader({ icon, title, subtitle, right }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="shrink-0 scale-110" style={{ color: "var(--brand-green)" }}>{icon}</span>
          <h1 className="text-xl lg:text-2xl font-black tracking-tight leading-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
        </div>
        <p className="text-[11px] lg:text-sm font-bold opacity-60 leading-relaxed max-w-xl" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      </div>
      {right && (
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0">
          {right}
        </div>
      )}
    </div>
  );
}

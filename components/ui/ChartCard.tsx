import type { ReactNode } from "react";

interface ChartCardProps {
  title:      string;
  titleIcon?: ReactNode;
  subtitle?:  string;
  right?:     ReactNode;
  children:   ReactNode;
}

export function ChartCard({ title, titleIcon, subtitle, right, children }: ChartCardProps) {
  return (
    <div className="premium-card p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-text-primary flex items-center gap-2">
            {titleIcon}
            {title}
          </h2>
          {subtitle && (
            <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest opacity-40">
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
      {/* Inset well for chart area — matches dashboard chart wells */}
      <div
        className="rounded-xl overflow-hidden p-2"
        style={{
          background:  "var(--neu-base)",
          boxShadow:   "var(--shadow-inset)",
          border:      "var(--card-border)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  return (
    <div className="space-y-1">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary flex items-center gap-2">
        {icon}{title}
      </h2>
      {subtitle && (
        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">
          {subtitle}
        </p>
      )}
    </div>
  );
}

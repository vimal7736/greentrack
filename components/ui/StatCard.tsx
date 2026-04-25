import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  unit:  string;
  icon:  ReactNode;
}

export function StatCard({ label, value, unit, icon }: StatCardProps) {
  return (
    <div className="premium-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group border-none">
      <div className="flex items-start justify-between relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
          {label}
        </span>
        <div className="w-8 h-8 rounded-xl bg-bg-inset flex items-center justify-center text-text-muted group-hover:bg-gt-green-500 group-hover:text-white transition-all">
          {icon}
        </div>
      </div>
      <div className="relative z-10 flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tighter text-text-primary">{value}</span>
        <span className="text-xs font-bold text-text-muted">{unit}</span>
      </div>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gt-green-500/5 rounded-full blur-2xl group-hover:bg-gt-green-500/10 transition-colors" />
    </div>
  );
}

import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: string;
  icon: ReactNode;
  iconBg?: string;
  valueColor?: string;
}

export function StatCard({ 
  label, value, unit, sub, icon, 
  iconBg = "bg-bg-inset group-hover:bg-gt-green-500", 
  valueColor = "text-text-primary" 
}: StatCardProps) {
  return (
    <div className="premium-card p-6 flex flex-col justify-between h-auto min-h-[8rem] relative overflow-hidden group border-none">
      <div className="flex items-start justify-between relative z-10 mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-50">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-text-muted transition-transform group-hover:scale-110 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-black tracking-tighter ${valueColor}`}>{value}</span>
          {unit && <span className="text-xs font-bold text-text-muted">{unit}</span>}
        </div>
        {sub && (
          <p className="text-[10px] font-bold text-text-muted mt-2 opacity-60 uppercase tracking-widest">{sub}</p>
        )}
      </div>
      <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-gt-green-500/5 rounded-full blur-2xl group-hover:bg-gt-green-500/10 transition-colors pointer-events-none" />
    </div>
  );
}

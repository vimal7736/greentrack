import { ArrowDown, ArrowUp } from "lucide-react";

interface DeltaChipProps {
  a: number;
  b: number;
}

export function DeltaChip({ a, b }: DeltaChipProps) {
  if (a === 0 && b === 0) {
    return <span className="text-[10px] font-black uppercase text-text-muted opacity-40">—</span>;
  }
  
  if (Math.abs(a - b) < 0.01) {
    return <span className="text-[10px] font-black uppercase text-text-muted opacity-40">—</span>;
  }

  const max = Math.max(a, b);
  const min = Math.min(a, b);
  const ratio = min > 0 ? max / min : max;

  if (ratio < 1.05) {
    return <span className="text-[10px] font-black uppercase text-text-muted opacity-40">—</span>;
  }

  const down = a < b;

  return (
    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 shadow-sm border transition-all duration-300 hover:scale-105 ${
      down
        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
        : "bg-brand-orange/10 text-brand-orange-dark border-brand-orange/20 shadow-[0_0_12px_rgba(249,115,22,0.1)]"
    }`}>
      {down ? <ArrowDown className="w-2.5 h-2.5 shrink-0" /> : <ArrowUp className="w-2.5 h-2.5 shrink-0" />}
      <span>{ratio.toFixed(1)}x {down ? "Lower" : "Higher"}</span>
    </div>
  );
}

import { ArrowDown, ArrowUp } from "lucide-react";
import { calcDelta } from "@/lib/carbon/aggregate";

interface DeltaChipProps {
  a: number;
  b: number;
}

export function DeltaChip({ a, b }: DeltaChipProps) {
  const d   = calcDelta(a, b);
  const abs = Math.abs(d);
  if (abs < 0.1) {
    return <span className="text-[10px] font-black uppercase text-text-muted opacity-40">—</span>;
  }
  const down = d < 0;
  return (
    <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-0.5 shadow-sm border ${
      down
        ? "bg-gt-green-500/10 text-gt-green-700 border-gt-green-500/20"
        : "bg-brand-orange/10 text-brand-orange-dark border-brand-orange/20"
    }`}>
      {down ? <ArrowDown className="w-2.5 h-2.5" /> : <ArrowUp className="w-2.5 h-2.5" />}
      {abs.toFixed(1)}%
    </div>
  );
}

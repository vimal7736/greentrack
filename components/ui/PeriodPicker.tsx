import { Calendar } from "lucide-react";

interface PeriodPickerProps {
  label:          string;
  color:          string;
  from:           string;
  to:             string;
  onFromChange:   (v: string) => void;
  onToChange:     (v: string) => void;
}

export function PeriodPicker({ label, color, from, to, onFromChange, onToChange }: PeriodPickerProps) {
  const fields: [string, string, (v: string) => void][] = [
    ["Start Month", from, onFromChange],
    ["End Month",   to,   onToChange],
  ];

  return (
    <div className="premium-card p-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full opacity-60" style={{ background: color }} />
      <div className="flex items-center justify-between mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color }}>
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg bg-bg-inset flex items-center justify-center group-hover:scale-110 transition-transform">
          <Calendar className="w-4 h-4 text-text-muted" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {fields.map(([lbl, val, onChange]) => (
          <div key={lbl}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-text-muted opacity-50">{lbl}</p>
            <input
              type="month"
              value={val}
              onChange={(e) => onChange(e.target.value)}
              className="w-full bg-bg-inset/50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black text-text-primary focus:border-gt-green-500 focus:bg-white transition-all outline-none"
              style={{ colorScheme: "light dark" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

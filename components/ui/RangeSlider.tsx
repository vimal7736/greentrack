interface RangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit: string;
  accent: string;
}

export function RangeSlider({ label, value, min, max, step, onChange, unit, accent }: RangeSliderProps) {
  // Clamp value between min and max boundaries to prevent negative percentages
  const clampedValue = Math.max(min, Math.min(max, value || 0));
  const pct = ((clampedValue - min) / (max - min)) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-text-muted opacity-50 mb-0.5">{label}</p>
          <p className="text-sm font-black text-text-primary tracking-tight">{clampedValue.toLocaleString()} <span className="text-[10px] opacity-30">{unit}</span></p>
        </div>
        <div className="px-2 py-0.5 rounded-md bg-bg-inset text-[9px] font-black text-text-muted">
           {pct.toFixed(0)}%
        </div>
      </div>
      <div className="relative group h-5 flex items-center">
         <div className="absolute inset-x-0 h-1 bg-bg-inset rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300 relative" 
              style={{ width: `${pct}%`, background: accent }}
            >
               <div className="absolute top-0 right-0 h-full w-4 bg-white/20 blur-sm" />
            </div>
         </div>
         <input
           type="range" min={min} max={max} step={step} value={clampedValue}
           onChange={(e) => onChange(Number(e.target.value))}
           className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10"
         />
         <div 
           className="absolute w-4 h-4 rounded-full bg-white shadow-premium border-2 pointer-events-none transition-transform group-active:scale-90"
           style={{ left: `calc(${pct}% - 8px)`, borderColor: accent }}
         />
      </div>
    </div>
  );
}


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
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-50 mb-1">{label}</p>
          <p className="text-xl font-black text-text-primary tracking-tight">{value.toLocaleString()} <span className="text-xs opacity-30">{unit}</span></p>
        </div>
        <div className="px-3 py-1 rounded-lg bg-bg-inset text-[10px] font-black text-text-muted">
           {pct.toFixed(0)}%
        </div>
      </div>
      <div className="relative group h-8 flex items-center">
         <div className="absolute inset-x-0 h-2 bg-bg-inset rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300 relative" 
              style={{ width: `${pct}%`, background: accent }}
            >
               <div className="absolute top-0 right-0 h-full w-4 bg-white/20 blur-sm" />
            </div>
         </div>
         <input
           type="range" min={min} max={max} step={step} value={value}
           onChange={(e) => onChange(Number(e.target.value))}
           className="absolute inset-0 w-full opacity-0 cursor-pointer h-full z-10"
         />
         <div 
           className="absolute w-6 h-6 rounded-full bg-white shadow-premium border-2 pointer-events-none transition-transform group-active:scale-90"
           style={{ left: `calc(${pct}% - 12px)`, borderColor: accent }}
         />
      </div>
    </div>
  );
}

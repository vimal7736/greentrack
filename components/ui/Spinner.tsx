interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = "Loading..." }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-gt-green-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{label}</span>
    </div>
  );
}

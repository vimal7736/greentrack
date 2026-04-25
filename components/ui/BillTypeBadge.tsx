import { BILL_TYPE_BADGE_CLASSES, BILL_TYPE_LABELS } from "@/lib/carbon/constants";

interface BillTypeBadgeProps {
  type: string;
}

export function BillTypeBadge({ type }: BillTypeBadgeProps) {
  const classes = BILL_TYPE_BADGE_CLASSES[type] ?? "text-text-muted bg-bg-inset border-border-subtle";
  const label   = BILL_TYPE_LABELS[type] ?? type;
  const dotClass = classes.split(" ")[0];

  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full animate-pulse-green bg-current ${dotClass}`} />
      <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${classes}`}>
        {label}
      </span>
    </div>
  );
}

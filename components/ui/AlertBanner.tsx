import { CheckCircle, AlertCircle, Info } from "lucide-react";

type AlertVariant = "success" | "warning" | "error" | "info";

interface AlertBannerProps {
  variant: AlertVariant;
  message: string;
}

export function AlertBanner({ variant, message }: AlertBannerProps) {
  const styles = {
    success: {
      border: "border-l-gt-green-500",
      bg: "bg-gt-green-500/5",
      iconColor: "text-gt-green-600",
      textColor: "text-gt-green-800",
      Icon: CheckCircle,
    },
    warning: {
      border: "border-l-brand-orange",
      bg: "bg-brand-orange/5",
      iconColor: "text-brand-orange",
      textColor: "text-brand-orange-dark",
      Icon: AlertCircle,
    },
    error: {
      border: "border-l-red-500",
      bg: "bg-red-500/5",
      iconColor: "text-red-500",
      textColor: "text-red-700",
      Icon: AlertCircle,
    },
    info: {
      border: "border-l-blue-500",
      bg: "bg-blue-500/5",
      iconColor: "text-blue-500",
      textColor: "text-blue-700",
      Icon: Info,
    },
  }[variant];

  const { Icon } = styles;

  return (
    <div className={`premium-card p-4 border-l-4 ${styles.border} ${styles.bg} flex items-center gap-3 animate-scale-in`}>
      <Icon className={`w-5 h-5 ${styles.iconColor}`} />
      <p className={`text-xs font-black ${styles.textColor} uppercase tracking-widest`}>{message}</p>
    </div>
  );
}

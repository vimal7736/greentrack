import type { ReactNode } from "react";
import { PageBackground } from "./PageBackground";
import { PageHeader } from "./PageHeader";
import { AlertBanner } from "./AlertBanner";
import { Spinner } from "./Spinner";

interface PageLayoutProps {
  title: string;
  subtitle: ReactNode;
  icon: ReactNode;
  headerRight?: ReactNode;
  alerts?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}

export function PageLayout({
  title,
  subtitle,
  icon,
  headerRight,
  alerts,
  loading,
  loadingLabel = "Loading...",
  error,
  children,
  className = "",
}: PageLayoutProps) {
  return (
    <div className={`relative space-y-8 animate-fade-in pb-20 ${className}`}>
      <PageBackground />

      <PageHeader
        icon={icon}
        title={title}
        subtitle={subtitle}
        right={headerRight}
      />

      {(alerts || error) && (
        <div className="space-y-4">
          {alerts}
          {error && <AlertBanner variant="error" message={error} />}
        </div>
      )}

      {loading ? (
        <div className="py-20">
          <Spinner label={loadingLabel} />
        </div>
      ) : (
        <div className="animate-scale-in space-y-8">
          {children}
        </div>
      )}
    </div>
  );
}

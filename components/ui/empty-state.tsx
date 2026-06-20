import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-border bg-surface/50 p-12 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary text-text-muted">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
      {description && (
        <p className="mb-6 max-w-md text-sm text-text-muted">{description}</p>
      )}
      {action}
    </div>
  );
}

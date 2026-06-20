import * as React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-8 md:flex-row md:items-center md:justify-between",
        className,
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-heading">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

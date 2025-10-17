import * as React from "react";

import { cn } from "@/lib/utils";

type StatusVariant = "destructive" | "warning" | "success" | "default" | "secondary" | "outline";

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant = "default", children, className, ...props }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center justify-center whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors",
        variant === "destructive" && "bg-destructive/20 text-destructive",
        variant === "warning" && "bg-yellow-500/20 text-yellow-500",
        variant === "success" && "bg-green-500/20 text-green-500",
        variant === "default" && "border-transparent bg-primary text-primary-foreground",
        variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground",
        variant === "outline" && "border border-input bg-background text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}


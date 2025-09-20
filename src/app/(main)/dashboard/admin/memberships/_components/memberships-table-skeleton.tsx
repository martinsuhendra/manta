"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function MembershipsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="bg-muted/50 h-12 border-b">
          <div className="flex items-center px-4 py-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="mr-4 h-4 w-20" />
            ))}
          </div>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center border-b px-4 py-3">
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="mr-4 h-8 w-20" />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

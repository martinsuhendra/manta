"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function TransactionsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="bg-muted/50 hidden border-b md:block">
          <div className="flex items-center gap-4 px-4 py-3">
            {Array.from({ length: 7 }, (_, i) => `header-${i}`).map((key) => (
              <Skeleton key={key} className="h-4 w-24" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }, (_, i) => `row-${i}`).map((rowKey) => (
          <div key={rowKey} className="flex items-center gap-4 border-b px-4 py-4 last:border-0">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56 sm:hidden" />
            </div>
            <Skeleton className="hidden h-4 w-32 md:block" />
            <Skeleton className="hidden h-4 w-20 md:block" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="hidden h-4 w-24 lg:block" />
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

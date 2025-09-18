import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function UsersTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-8 w-24" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Button disabled>
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <div className="p-0">
          {/* Table Header */}
          <div className="bg-muted/50 flex items-center border-b px-4 py-3">
            <div className="flex flex-1 items-center space-x-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }, (_, index) => `skeleton-${index}`).map((skeletonKey) => (
            <div key={skeletonKey} className="flex items-center border-b px-4 py-4">
              <div className="flex flex-1 items-center space-x-4">
                {/* Checkbox */}
                <Skeleton className="h-4 w-4" />

                {/* Name & Email */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>

                {/* Role */}
                <Skeleton className="h-6 w-16 rounded-full" />

                {/* Phone */}
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-24" />
                </div>

                {/* Payment Method */}
                <Skeleton className="h-6 w-20 rounded-full" />

                {/* Memberships */}
                <Skeleton className="h-6 w-8 rounded-full" />

                {/* Created Date */}
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-20" />
                </div>

                {/* Actions */}
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}

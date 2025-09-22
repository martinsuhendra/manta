import * as React from "react";

import { Edit2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { QuotaPool } from "./schema";

interface QuotaPoolViewProps {
  pool: QuotaPool;
  hasUsage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function QuotaPoolView({ pool, hasUsage, onEdit, onDelete }: QuotaPoolViewProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="font-medium">{pool.name}</div>
        {pool.description && <div className="text-muted-foreground text-sm">{pool.description}</div>}
        <div className="text-muted-foreground mt-1 text-sm">Total Quota: {pool.totalQuota}</div>
        {hasUsage && (
          <div className="text-muted-foreground mt-1 text-xs">⚠️ Active quota usage - quota settings protected</div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={pool.isActive ? "default" : "secondary"}>{pool.isActive ? "Active" : "Inactive"}</Badge>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onEdit}
          disabled={hasUsage}
          title={hasUsage ? "Cannot edit quota pool with active usage" : "Edit pool"}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onDelete}
          disabled={hasUsage}
          title={hasUsage ? "Cannot delete quota pool with active usage" : "Delete pool"}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

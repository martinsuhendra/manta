import * as React from "react";

import { AlertTriangle, Check, XIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { CreateQuotaPoolForm, QuotaPool } from "./schema";

interface QuotaPoolEditorProps {
  pool: QuotaPool;
  editingPool: CreateQuotaPoolForm;
  setEditingPool: React.Dispatch<React.SetStateAction<CreateQuotaPoolForm>>;
  hasUsage: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function QuotaPoolEditor({
  pool,
  editingPool,
  setEditingPool,
  hasUsage,
  onSave,
  onCancel,
}: QuotaPoolEditorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Edit Pool</h4>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={onSave}>
            <Check className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasUsage && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This quota pool has active usage. Total quota cannot be modified to protect existing memberships.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <div>
          <Label htmlFor={`edit-pool-name-${pool.id}`} className="mb-2">
            Pool Name
          </Label>
          <Input
            id={`edit-pool-name-${pool.id}`}
            value={editingPool.name}
            onChange={(e) => setEditingPool((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Group Classes"
          />
        </div>
        <div>
          <Label htmlFor={`edit-pool-description-${pool.id}`} className="mb-2">
            Description (optional)
          </Label>
          <Input
            id={`edit-pool-description-${pool.id}`}
            value={editingPool.description}
            onChange={(e) => setEditingPool((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="e.g., Shared quota for all group classes"
          />
        </div>
        <div>
          <Label htmlFor={`edit-pool-quota-${pool.id}`} className="mb-2">
            Total Quota
          </Label>
          <Input
            id={`edit-pool-quota-${pool.id}`}
            type="number"
            min="1"
            value={editingPool.totalQuota}
            onChange={(e) => setEditingPool((prev) => ({ ...prev, totalQuota: parseInt(e.target.value) || 1 }))}
            disabled={hasUsage}
          />
        </div>
      </div>
    </div>
  );
}

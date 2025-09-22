import { useState } from "react";

import { Plus, Edit2, Check, XIcon, AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { QuotaPool, CreateQuotaPoolForm } from "./schema";

interface QuotaPoolsSectionProps {
  quotaPools: QuotaPool[];
  setQuotaPools: (pools: QuotaPool[]) => void;
}

export function QuotaPoolsSection({ quotaPools, setQuotaPools }: QuotaPoolsSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPoolData, setNewPoolData] = useState<CreateQuotaPoolForm>({
    name: "",
    description: "",
    totalQuota: 1,
    isActive: true,
  });

  const handleCreatePool = () => {
    if (!newPoolData.name.trim()) return;

    const newPool: QuotaPool = {
      id: `temp-${Date.now()}`,
      productId: "",
      name: newPoolData.name,
      description: newPoolData.description || null,
      totalQuota: newPoolData.totalQuota,
      isActive: newPoolData.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuotaPools([...quotaPools, newPool]);
    setNewPoolData({ name: "", description: "", totalQuota: 1, isActive: true });
    setIsCreating(false);
  };

  const handleUpdatePool = (poolId: string, updatedData: Partial<QuotaPool>) => {
    setQuotaPools(quotaPools.map((pool) => (pool.id === poolId ? { ...pool, ...updatedData } : pool)));
    setEditingId(null);
  };

  const handleDeletePool = (poolId: string) => {
    setQuotaPools(quotaPools.filter((pool) => pool.id !== poolId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quota Pools</span>
          <Button size="sm" onClick={() => setIsCreating(true)} disabled={isCreating}>
            <Plus className="mr-1 h-4 w-4" />
            Add Pool
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isCreating && (
            <div className="rounded-lg border p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Create New Pool</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setIsCreating(false)}>
                      <XIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleCreatePool} disabled={!newPoolData.name.trim()}>
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="pool-name">Pool Name *</Label>
                    <Input
                      id="pool-name"
                      value={newPoolData.name}
                      onChange={(e) => setNewPoolData({ ...newPoolData, name: e.target.value })}
                      placeholder="e.g., Main Quota Pool"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pool-quota">Total Quota *</Label>
                    <Input
                      id="pool-quota"
                      type="number"
                      min="1"
                      value={newPoolData.totalQuota}
                      onChange={(e) => setNewPoolData({ ...newPoolData, totalQuota: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="pool-description">Description</Label>
                    <Input
                      id="pool-description"
                      value={newPoolData.description}
                      onChange={(e) => setNewPoolData({ ...newPoolData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {quotaPools.map((pool) => {
            const hasUsage = Boolean(
              (pool as QuotaPool & { _count?: { membershipQuotaUsage: number } })._count?.membershipQuotaUsage,
            );

            return (
              <div key={pool.id} className="rounded-lg border p-4">
                {editingId === pool.id ? (
                  <EditPoolForm
                    pool={pool}
                    onSave={(updatedData) => handleUpdatePool(pool.id, updatedData)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{pool.name}</h4>
                        <Badge variant={pool.isActive ? "default" : "secondary"}>
                          {pool.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {pool.description && <p className="text-muted-foreground text-sm">{pool.description}</p>}
                      <p className="text-muted-foreground text-sm">Total Quota: {pool.totalQuota}</p>
                      {hasUsage && (
                        <Alert className="mt-2">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>This pool is being used by existing memberships.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingId(pool.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {!hasUsage && (
                        <Button size="sm" variant="outline" onClick={() => handleDeletePool(pool.id)}>
                          <XIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface EditPoolFormProps {
  pool: QuotaPool;
  onSave: (data: Partial<QuotaPool>) => void;
  onCancel: () => void;
}

function EditPoolForm({ pool, onSave, onCancel }: EditPoolFormProps) {
  const [formData, setFormData] = useState({
    name: pool.name,
    description: pool.description || "",
    totalQuota: pool.totalQuota,
    isActive: pool.isActive,
  });

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave({
      name: formData.name,
      description: formData.description || null,
      totalQuota: formData.totalQuota,
      isActive: formData.isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Edit Pool</h4>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            <XIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!formData.name.trim()}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="edit-pool-name">Pool Name *</Label>
          <Input
            id="edit-pool-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="edit-pool-quota">Total Quota *</Label>
          <Input
            id="edit-pool-quota"
            type="number"
            min="1"
            value={formData.totalQuota}
            onChange={(e) => setFormData({ ...formData, totalQuota: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="edit-pool-description">Description</Label>
          <Input
            id="edit-pool-description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

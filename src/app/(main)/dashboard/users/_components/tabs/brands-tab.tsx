"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrandsAdmin } from "@/hooks/use-brands-query";

interface UserBrandRow {
  brandId: string;
  role: string;
  isDefault: boolean;
  brand: { id: string; name: string; slug: string; isActive: boolean };
}

interface BrandsTabProps {
  userId: string;
}

export function BrandsTab({ userId }: BrandsTabProps) {
  const queryClient = useQueryClient();
  const { data: userBrands = [], isLoading } = useQuery<UserBrandRow[]>({
    queryKey: ["user-brands", userId],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/users/${userId}/brands`);
      return res.data;
    },
    enabled: !!userId,
  });
  const { data: allBrands = [] } = useBrandsAdmin();

  const assignMutation = useMutation({
    mutationFn: async ({ brandId, isDefault }: { brandId: string; isDefault: boolean }) => {
      await axios.post(`/api/admin/users/${userId}/brands`, { brandId, role: "MEMBER", isDefault });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-brands", userId] });
      toast.success("Brand assigned");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? "Failed to assign brand");
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (brandId: string) => {
      await axios.delete(`/api/admin/users/${userId}/brands?brandId=${brandId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-brands", userId] });
      toast.success("Brand removed");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error ?? "Failed to remove brand");
    },
  });

  const assignedBrandIds = userBrands.map((ub) => ub.brandId);
  const availableBrands = allBrands.filter((b) => b.isActive && !assignedBrandIds.includes(b.id));

  if (isLoading) {
    return <div className="text-muted-foreground py-4 text-sm">Loading brands…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Brands this user can access.</p>
        {availableBrands.length > 0 && (
          <Select
            onValueChange={(brandId) => {
              const isFirst = userBrands.length === 0;
              assignMutation.mutate({ brandId, isDefault: isFirst });
            }}
            disabled={assignMutation.isPending}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Assign brand" />
            </SelectTrigger>
            <SelectContent>
              {availableBrands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {userBrands.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm">
          <Building2 className="h-8 w-8" />
          <p>No brands assigned. Assign a brand so this user can access the dashboard.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {userBrands.map((ub) => (
            <li key={ub.brandId} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="font-medium">{ub.brand.name}</span>
              <div className="flex items-center gap-2">
                {ub.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    Default
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-8 w-8"
                  onClick={() => unassignMutation.mutate(ub.brandId)}
                  disabled={unassignMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

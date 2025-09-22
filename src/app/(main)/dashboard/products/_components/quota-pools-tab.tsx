import * as React from "react";

import { Package } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { QuotaPool } from "./schema";

interface QuotaPoolsTabProps {
  quotaPools: QuotaPool[];
}

export function QuotaPoolsTab({ quotaPools }: QuotaPoolsTabProps) {
  if (quotaPools.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        <Package className="mx-auto h-12 w-12 opacity-50" />
        <p className="mt-2">No quota pools configured for this product yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Quota Pools ({quotaPools.length})</h4>
      <div className="space-y-4">
        {quotaPools.map((pool) => (
          <Card key={pool.id}>
            <CardHeader>
              <CardTitle className="text-base">{pool.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pool.description && (
                  <div>
                    <span className="text-muted-foreground text-xs">Description</span>
                    <p className="text-sm">{pool.description}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground text-xs">Total Quota</span>
                  <p className="text-sm font-medium">{pool.totalQuota}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Status</span>
                  <p className="text-sm">{pool.isActive ? "Active" : "Inactive"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

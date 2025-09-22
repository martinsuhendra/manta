"use client";

import * as React from "react";

import { Calendar, Clock, DollarSign, Package, ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePurchaseMembership } from "@/hooks/use-memberships-mutation";
import { formatPrice } from "@/lib/utils";

import { Product } from "../../products/_components/schema";

interface MembershipPurchaseProps {
  products: Product[];
  isLoading: boolean;
}

export function MembershipPurchase({ products, isLoading }: MembershipPurchaseProps) {
  const purchaseMembership = usePurchaseMembership();

  const handlePurchase = async (productId: string) => {
    await purchaseMembership.mutateAsync({
      productId: productId,
      transactionId: `txn_${Date.now()}`, // In real app, this would come from payment processor
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => `skeleton-${index}`).map((skeletonKey) => (
            <div key={skeletonKey} className="space-y-2 rounded-lg border p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Available Memberships
        </CardTitle>
        <CardDescription>Choose a membership plan that suits your needs</CardDescription>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="py-8 text-center">
            <Package className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-2 text-sm font-semibold">No memberships available</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              There are currently no active membership products to purchase.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold">{product.name}</h4>
                    {product.description && <p className="text-muted-foreground text-sm">{product.description}</p>}
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="text-muted-foreground h-4 w-4" />
                    <span>{product.validDays} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    <span>{product._count.memberships} sold</span>
                  </div>
                </div>

                {product.features.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-sm font-medium">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={() => handlePurchase(product.id)}
                    disabled={purchaseMembership.isPending}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {purchaseMembership.isPending ? "Processing..." : "Purchase"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

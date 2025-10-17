"use client";

import * as React from "react";

import { differenceInDays, format, isAfter } from "date-fns";
import { Calendar, Clock, CreditCard, Package } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";

interface Membership {
  id: string;
  licenseCode: string;
  status: string;
  useCount: number;
  remainingQuota: number;
  joinDate: string;
  expiredAt: string;
  transactionId?: string;
  customerName?: string;
  customerEmail?: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    description?: string;
    price: number;
    validDays: number;
    quota: number;
    isActive: boolean;
    features: string[];
  };
  user: {
    id: string;
    name?: string;
    email?: string;
  };
}

interface MyMembershipsProps {
  memberships: Membership[];
  isLoading: boolean;
}

export function MyMemberships({ memberships, isLoading }: MyMembershipsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => `skeleton-${index}`).map((skeletonKey) => (
            <div key={skeletonKey} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-2 w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const activeMemberships = memberships.filter(
    (m) => m.status === "ACTIVE" && isAfter(new Date(m.expiredAt), new Date()),
  );
  const expiredMemberships = memberships.filter(
    (m) => m.status !== "ACTIVE" || !isAfter(new Date(m.expiredAt), new Date()),
  );

  const getStatusVariant = (membership: Membership) => {
    const isExpired = !isAfter(new Date(membership.expiredAt), new Date());
    if (isExpired) return "destructive";
    if (membership.remainingQuota === 0) return "secondary";
    return "default";
  };

  const getStatusLabel = (membership: Membership) => {
    const isExpired = !isAfter(new Date(membership.expiredAt), new Date());
    if (isExpired) return "Expired";
    if (membership.remainingQuota === 0) return "Quota Used";
    return "Active";
  };

  const getDaysRemaining = (expiredAt: string) => {
    const days = differenceInDays(new Date(expiredAt), new Date());
    return Math.max(0, days);
  };

  const getUsagePercentage = (used: number, total: number) => {
    return total > 0 ? (used / total) * 100 : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          My Memberships
        </CardTitle>
        <CardDescription>Your current and past membership subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        {memberships.length === 0 ? (
          <div className="py-8 text-center">
            <Package className="text-muted-foreground mx-auto h-12 w-12" />
            <h3 className="mt-2 text-sm font-semibold">No memberships yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">Purchase your first membership to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active Memberships */}
            {activeMemberships.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-medium">Active Memberships</h4>
                <div className="space-y-3">
                  {activeMemberships.map((membership) => (
                    <div key={membership.id} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h5 className="font-semibold">{membership.product.name}</h5>
                          <p className="text-muted-foreground text-sm">License: {membership.licenseCode}</p>
                        </div>
                        <StatusBadge variant={getStatusVariant(membership)}>{getStatusLabel(membership)}</StatusBadge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Usage Progress</span>
                          <span>
                            {membership.useCount} / {membership.product.quota} used
                          </span>
                        </div>
                        <Progress
                          value={getUsagePercentage(membership.useCount, membership.product.quota)}
                          className="h-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-muted-foreground h-4 w-4" />
                          <div>
                            <p className="font-medium">Expires</p>
                            <p className="text-muted-foreground">
                              {format(new Date(membership.expiredAt), "MMM dd, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="text-muted-foreground h-4 w-4" />
                          <div>
                            <p className="font-medium">Days Left</p>
                            <p className="text-muted-foreground">{getDaysRemaining(membership.expiredAt)} days</p>
                          </div>
                        </div>
                      </div>

                      {membership.product.features.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <p className="mb-2 text-sm font-medium">Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {membership.product.features.map((feature) => (
                                <StatusBadge key={feature} variant="outline" className="text-xs">
                                  {feature}
                                </StatusBadge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expired/Inactive Memberships */}
            {expiredMemberships.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-medium">Past Memberships</h4>
                <div className="space-y-3">
                  {expiredMemberships.slice(0, 3).map((membership) => (
                    <div key={membership.id} className="space-y-2 rounded-lg border p-4 opacity-60">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">{membership.product.name}</h5>
                        <StatusBadge variant={getStatusVariant(membership)}>{getStatusLabel(membership)}</StatusBadge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Used: {membership.useCount}/{membership.product.quota}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Expired: {format(new Date(membership.expiredAt), "MMM dd, yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {expiredMemberships.length > 3 && (
                    <p className="text-muted-foreground text-center text-sm">
                      +{expiredMemberships.length - 3} more expired memberships
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

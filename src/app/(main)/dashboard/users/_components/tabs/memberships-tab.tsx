"use client";

import * as React from "react";

import { UserCheck } from "lucide-react";

import { EmptyState } from "./empty-state";
import { MembershipCard } from "./membership-card";
import { MembershipDetails } from "./membership-details";
import { SeeHistoryButton } from "./see-history-button";

interface Membership {
  id: string;
  status: string;
  joinDate: string;
  expiredAt: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    validDays: number;
  };
  transaction: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    paidAt: string | null;
    createdAt: string;
  } | null;
}

interface MembershipsTabProps {
  memberships: Membership[];
  memberId: string;
  memberName?: string | null;
}

export function MembershipsTab({ memberships, memberId, memberName }: MembershipsTabProps) {
  const activeMembership = React.useMemo(() => {
    return memberships.find((m) => m.status === "ACTIVE" && new Date(m.expiredAt) > new Date());
  }, [memberships]);

  if (memberships.length === 0) {
    return <EmptyState icon={UserCheck} title="No Memberships" description="This member has no membership history." />;
  }

  const hasHistory = memberships.length > (activeMembership ? 1 : 0);

  return (
    <div className="space-y-6">
      {activeMembership && memberName && (
        <div className="space-y-4">
          <h3 className="text-muted-foreground text-sm font-medium uppercase">Active Membership</h3>
          <MembershipCard
            memberName={memberName}
            productName={activeMembership.product.name}
            expiredAt={activeMembership.expiredAt}
          />
          <MembershipDetails membership={activeMembership} />
        </div>
      )}

      <SeeHistoryButton href={`/dashboard/users/${memberId}/memberships`} show={hasHistory} />
    </div>
  );
}

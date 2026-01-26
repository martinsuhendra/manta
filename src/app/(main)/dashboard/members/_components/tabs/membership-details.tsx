import { format } from "date-fns";

import { StatusBadge } from "@/components/ui/status-badge";
import { formatPrice } from "@/lib/utils";

import { getMembershipStatusVariant } from "./utils";

interface MembershipDetailsProps {
  membership: {
    product: {
      price: number;
      validDays: number;
    };
    joinDate: string;
    expiredAt: string;
    transaction: {
      status: string;
      paidAt: string | null;
    } | null;
  };
}

export function MembershipDetails({ membership }: MembershipDetailsProps) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Price</span>
        <span className="font-medium tabular-nums">{formatPrice(membership.product.price)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Valid Days</span>
        <span className="font-medium tabular-nums">{membership.product.validDays} days</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Join Date</span>
        <span className="font-medium tabular-nums">{format(new Date(membership.joinDate), "MMM dd, yyyy")}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Expires</span>
        <span className="font-medium tabular-nums">{format(new Date(membership.expiredAt), "MMM dd, yyyy")}</span>
      </div>
      {membership.transaction && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Transaction Status</span>
            <StatusBadge variant={membership.transaction.status === "COMPLETED" ? "default" : "secondary"}>
              {membership.transaction.status}
            </StatusBadge>
          </div>
          {membership.transaction.paidAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Paid At</span>
              <span className="font-medium tabular-nums">
                {format(new Date(membership.transaction.paidAt), "MMM dd, yyyy")}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

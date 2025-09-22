"use client";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { Membership } from "./schema";

interface ViewMembershipDialogProps {
  membership: Membership | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewMembershipDialog({ membership, open, onOpenChange }: ViewMembershipDialogProps) {
  if (!membership) return null;

  const statusVariant =
    membership.status === "ACTIVE"
      ? "default"
      : membership.status === "EXPIRED"
        ? "destructive"
        : membership.status === "SUSPENDED"
          ? "secondary"
          : "outline";

  const isExpired = new Date(membership.expiredAt) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Membership Details</DialogTitle>
          <DialogDescription>Complete information about this membership.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">User Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Name:</span>
                <div>{membership.user.name || "N/A"}</div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Email:</span>
                <div>{membership.user.email || "N/A"}</div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Phone:</span>
                <div>{membership.user.phoneNo || "N/A"}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Product Information */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Product Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Product:</span>
                <div>{membership.product.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Price:</span>
                <div>${membership.product.price}</div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Valid Days:</span>
                <div>{membership.product.validDays} days</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Membership Status */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Membership Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Status:</span>
                <div className="mt-1">
                  <Badge variant={statusVariant}>{membership.status}</Badge>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-medium">Join Date:</span>
                <div>{format(new Date(membership.joinDate), "MMM dd, yyyy")}</div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Expires:</span>
                <div className={isExpired ? "text-destructive font-medium" : ""}>
                  {format(new Date(membership.expiredAt), "MMM dd, yyyy 'at' HH:mm")}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Timestamps</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Created:</span>
                <div>{format(new Date(membership.createdAt), "MMM dd, yyyy 'at' HH:mm")}</div>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Updated:</span>
                <div>{format(new Date(membership.updatedAt), "MMM dd, yyyy 'at' HH:mm")}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

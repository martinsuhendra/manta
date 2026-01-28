"use client";

import * as React from "react";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CreditCard, Calendar, Package, CheckCircle2, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMidtransSnap } from "@/lib/hooks/use-midtrans-snap";
import { formatPrice } from "@/lib/utils";

import { MemberDetails } from "../schema";

import { EmptyState } from "./empty-state";
import { SeeHistoryButton } from "./see-history-button";
import { getTransactionStatusIcon, getTransactionStatusVariant } from "./utils";

interface Transaction {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  paymentProvider: string | null;
  paidAt: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
}

interface TransactionsTabProps {
  transactions: Transaction[];
  memberId: string;
}

const RECENT_LIMIT = 3;

export function TransactionsTab({ transactions, memberId }: TransactionsTabProps) {
  const recentTransactions = React.useMemo(() => transactions.slice(0, RECENT_LIMIT), [transactions]);

  if (transactions.length === 0) {
    return (
      <EmptyState icon={CreditCard} title="No Transactions" description="This member has no transaction history." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Transactions</h3>
        <StatusBadge variant="secondary">{transactions.length} total</StatusBadge>
      </div>

      <div className="space-y-3">
        {recentTransactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} memberId={memberId} />
        ))}
      </div>

      <SeeHistoryButton
        href={`/dashboard/members/${memberId}/transactions`}
        show={transactions.length > RECENT_LIMIT}
      />
    </div>
  );
}

function TransactionCard({ transaction, memberId }: { transaction: Transaction; memberId: string }) {
  const queryClient = useQueryClient();
  const { isLoaded: isSnapLoaded, openSnap } = useMidtransSnap();
  const [isLoadingPayment, setIsLoadingPayment] = React.useState(false);
  const [isSettling, setIsSettling] = React.useState(false);
  const [settleDialogOpen, setSettleDialogOpen] = React.useState(false);
  const isCompleted = transaction.status === "COMPLETED";
  const isPending = transaction.status === "PENDING";
  const isMidtrans = transaction.paymentProvider === "midtrans";

  const handlePayNow = async () => {
    if (!isSnapLoaded) {
      toast.error("Payment gateway is loading. Please wait a moment and try again.");
      return;
    }

    setIsLoadingPayment(true);
    try {
      const response = await fetch(`/api/admin/transactions/${transaction.id}/snap-token`);
      const result = await response.json();

      if (!response.ok) {
        toast.error("Failed to open payment", {
          description: result.error || "Something went wrong.",
        });
        return;
      }

      if (!result.snapToken) {
        toast.error("Failed to initialize payment", {
          description: "Payment token was not generated. Please try again.",
        });
        return;
      }

      // Open Midtrans Snap
      openSnap(result.snapToken, {
        onSuccess: () => {
          toast.success("Payment successful!", {
            description: "Transaction has been completed.",
          });
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["member-details", memberId] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
        onPending: () => {
          toast.info("Payment pending", {
            description: "Waiting for payment confirmation.",
          });
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ["users"] });
          queryClient.invalidateQueries({ queryKey: ["member-details", memberId] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
        onError: () => {
          toast.error("Payment failed", {
            description: "Please try again or contact support.",
          });
        },
        onClose: () => {
          // User closed the popup, no action needed
        },
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handleSettlePayment = async () => {
    setIsSettling(true);
    try {
      const response = await fetch(`/api/admin/transactions/${transaction.id}/settle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: "Cash",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Failed to settle transaction", {
          description: result.error || "Something went wrong.",
        });
        return;
      }

      toast.success("Transaction settled successfully!", {
        description: "Cash payment has been recorded and membership activated.",
      });

      setSettleDialogOpen(false);

      // Optimistically update the transaction in the cache for immediate UI feedback
      queryClient.setQueryData<MemberDetails>(["member-details", memberId], (oldData: MemberDetails | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          transactions: oldData.transactions.map((t) =>
            t.id === transaction.id
              ? {
                  ...t,
                  status: "COMPLETED",
                  paymentMethod: "Cash",
                  paymentProvider: "manual",
                  paidAt: new Date().toISOString(),
                }
              : t,
          ),
        };
      });

      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["member-details", memberId] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (error) {
      console.error("Settle payment error:", error);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsSettling(false);
    }
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isCompleted ? "bg-primary/5 border-primary/20" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="text-muted-foreground h-4 w-4" />
              <h4 className="font-semibold">{transaction.product.name}</h4>
            </div>
            <StatusBadge variant={getTransactionStatusVariant(transaction.status)}>
              <span className="mr-1">{getTransactionStatusIcon(transaction.status)}</span>
              {transaction.status}
            </StatusBadge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col items-start gap-2">
              <div>
                <p className="text-muted-foreground text-xs">Amount</p>
                <p className="font-semibold">
                  {formatPrice(transaction.amount)} {transaction.currency}
                </p>
              </div>
              {transaction.paymentMethod && (
                <div>
                  <p className="text-muted-foreground text-xs">Payment Method</p>
                  <p className="font-medium">{transaction.paymentMethod}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div>
                <p className="text-muted-foreground text-xs">Created</p>
                <div className="flex items-center gap-1">
                  <Calendar className="text-muted-foreground h-3 w-3" />
                  <p className="font-medium">{format(new Date(transaction.createdAt), "MMM dd, yyyy")}</p>
                </div>
              </div>
              {transaction.paymentProvider && (
                <div>
                  <p className="text-muted-foreground text-xs">Provider</p>
                  <p className="font-medium">{transaction.paymentProvider}</p>
                </div>
              )}
            </div>
          </div>

          {isPending && (
            <div className="space-y-2 border-t pt-3">
              {isMidtrans && (
                <Button
                  onClick={handlePayNow}
                  disabled={isLoadingPayment || !isSnapLoaded}
                  className="w-full"
                  size="sm"
                >
                  {isLoadingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay Now
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={() => setSettleDialogOpen(true)}
                variant={isMidtrans ? "outline" : "default"}
                className="w-full"
                size="sm"
              >
                <DollarSign className="mr-2 h-4 w-4" />
                Settle Cash Payment
              </Button>
            </div>
          )}

          {transaction.paidAt && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="text-muted-foreground h-3.5 w-3.5" />
                <p className="text-muted-foreground">
                  Paid on {format(new Date(transaction.paidAt), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={settleDialogOpen} onOpenChange={setSettleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settle Cash Payment</DialogTitle>
            <DialogDescription>
              Mark this transaction as completed with cash payment. The associated membership will be activated
              automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 rounded-lg border p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{transaction.product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    {formatPrice(transaction.amount)} {transaction.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">Cash</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSettleDialogOpen(false)} disabled={isSettling}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSettlePayment} disabled={isSettling}>
              {isSettling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Settling...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Confirm Cash Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

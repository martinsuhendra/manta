"use client";

import * as React from "react";

import { format } from "date-fns";
import { CreditCard, Calendar, Package, CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";
import { formatPrice } from "@/lib/utils";

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
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </div>

      <SeeHistoryButton
        href={`/dashboard/members/${memberId}/transactions`}
        show={transactions.length > RECENT_LIMIT}
      />
    </div>
  );
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const isCompleted = transaction.status === "COMPLETED";

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
    </div>
  );
}

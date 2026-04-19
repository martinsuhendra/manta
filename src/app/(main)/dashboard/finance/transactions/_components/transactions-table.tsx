"use client";

import * as React from "react";

import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAdminTransaction } from "@/hooks/use-admin-transactions-mutation";
import { AdminTransactionsFilters, useAdminTransactions } from "@/hooks/use-admin-transactions-query";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";
import { TRANSACTION_STATUS } from "@/lib/midtrans/constants";
import { cn } from "@/lib/utils";

import { createTransactionColumns } from "./columns";
import { formatPaymentMethodLabel, formatStatusLabel } from "./format-labels";
import { ManualTransactionDialog } from "./manual-transaction-dialog";
import { ManualTransactionFormValues, TransactionListItem } from "./schema";
import { TransactionDetailDrawer } from "./transaction-detail-drawer";
import { TransactionsTableSkeleton } from "./transactions-table-skeleton";

const statusFilters = [
  "ALL",
  TRANSACTION_STATUS.PENDING,
  TRANSACTION_STATUS.PROCESSING,
  TRANSACTION_STATUS.COMPLETED,
  TRANSACTION_STATUS.FAILED,
  TRANSACTION_STATUS.CANCELLED,
  TRANSACTION_STATUS.REFUNDED,
  TRANSACTION_STATUS.EXPIRED,
] as const;

const paymentMethodFilters = ["ALL", "manual", "cash", "transfer", "qris", "bank_transfer", "credit_card"] as const;

export function TransactionsTable() {
  const [isFilterPending, startFilterTransition] = React.useTransition();
  const [filters, setFilters] = React.useState<AdminTransactionsFilters>({
    status: "ALL",
    paymentMethod: "ALL",
    startDate: "",
    endDate: "",
  });
  const [selectedTransactionId, setSelectedTransactionId] = React.useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [isManualDialogOpen, setIsManualDialogOpen] = React.useState(false);

  const deferredFilters = React.useDeferredValue(filters);
  const { data = [], isLoading, isFetching } = useAdminTransactions({ filters: deferredFilters });
  const createMutation = useCreateAdminTransaction();
  const startDate = filters.startDate ? new Date(filters.startDate + "T00:00:00") : undefined;
  const endDate = filters.endDate ? new Date(filters.endDate + "T00:00:00") : undefined;

  const columns = React.useMemo(() => createTransactionColumns(), []);
  const table = useDataTableInstance({
    data,
    columns,
    defaultPageSize: 10,
  });

  async function handleCreateManualTransaction(values: ManualTransactionFormValues) {
    await createMutation.mutateAsync(values);
    toast.success("Transaction created successfully");
  }

  function handleRowClick(transaction: TransactionListItem) {
    setSelectedTransactionId(transaction.id);
    setIsDrawerOpen(true);
  }

  function updateStatusFilter(value: string) {
    startFilterTransition(() => {
      setFilters((prev) => (prev.status === value ? prev : { ...prev, status: value }));
    });
  }

  function updatePaymentMethodFilter(value: string) {
    startFilterTransition(() => {
      setFilters((prev) => (prev.paymentMethod === value ? prev : { ...prev, paymentMethod: value }));
    });
  }

  function updateStartDateFilter(value: string) {
    startFilterTransition(() => {
      setFilters((prev) => (prev.startDate === value ? prev : { ...prev, startDate: value }));
    });
  }

  function updateEndDateFilter(value: string) {
    startFilterTransition(() => {
      setFilters((prev) => (prev.endDate === value ? prev : { ...prev, endDate: value }));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-1 xl:flex-wrap xl:items-center">
          <Input
            placeholder="Search by user name"
            value={table.getState().globalFilter ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="w-full xl:w-[220px]"
          />
          <Select value={filters.status} onValueChange={updateStatusFilter}>
            <SelectTrigger className="w-full xl:w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {statusFilters.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatStatusLabel(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.paymentMethod} onValueChange={updatePaymentMethodFilter}>
            <SelectTrigger className="w-full xl:w-[170px]">
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethodFilters.map((method) => (
                <SelectItem key={method} value={method}>
                  {formatPaymentMethodLabel(method)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal xl:w-[160px]",
                  !startDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                <span className="truncate">{startDate ? format(startDate, "MMM d, yyyy") : "Start date"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => updateStartDateFilter(date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal xl:w-[160px]",
                  !endDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                <span className="truncate">{endDate ? format(endDate, "MMM d, yyyy") : "End date"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => updateEndDateFilter(date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
          <DataTableViewOptions table={table} />
          <Button className="w-full sm:w-auto" onClick={() => setIsManualDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Manual Transaction</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
      {isLoading ? (
        <TransactionsTableSkeleton />
      ) : (
        <>
          {(isFilterPending || isFetching) && <p className="text-muted-foreground text-xs">Updating filters...</p>}
          <div className="overflow-x-auto">
            <DataTable table={table} columns={columns} onRowClick={handleRowClick} />
          </div>
        </>
      )}
      <DataTablePagination table={table} />

      <TransactionDetailDrawer
        transactionId={selectedTransactionId}
        open={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) setSelectedTransactionId(null);
        }}
      />

      <ManualTransactionDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        onSubmit={handleCreateManualTransaction}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}

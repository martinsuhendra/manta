/* eslint-disable max-lines */
"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarClock,
  CreditCard,
  FileText,
  Loader2,
  Mail,
  Package,
  Phone,
  ReceiptText,
  ShieldCheck,
  User as UserIcon,
  Users,
  Wallet,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TRANSACTION_STATUS } from "@/lib/midtrans/constants";
import { cn } from "@/lib/utils";

import { formatPaymentMethodLabel, formatStatusLabel } from "./format-labels";
import { MemberCombobox } from "./member-combobox";
import { ManualTransactionFormValues, manualTransactionSchema } from "./schema";

interface MemberOption {
  id: string;
  name: string | null;
  email: string | null;
  phoneNo: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
}

interface ManualTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: ManualTransactionFormValues) => Promise<void>;
  isSubmitting: boolean;
}

const statusOptions = [
  TRANSACTION_STATUS.PENDING,
  TRANSACTION_STATUS.PROCESSING,
  TRANSACTION_STATUS.COMPLETED,
  TRANSACTION_STATUS.FAILED,
  TRANSACTION_STATUS.CANCELLED,
  TRANSACTION_STATUS.REFUNDED,
  TRANSACTION_STATUS.EXPIRED,
] as const;

const paymentMethodOptions = ["manual", "cash", "transfer", "bank_transfer", "qris", "credit_card"] as const;

const paymentProviderOptions = ["manual", "midtrans", "other"] as const;

const defaultValues: ManualTransactionFormValues = {
  userId: undefined,
  customerEmail: "",
  customerName: "",
  customerPhone: "",
  productId: "",
  amount: 0,
  status: TRANSACTION_STATUS.PENDING,
  paymentMethod: "manual",
  paymentProvider: "manual",
  paidAt: "",
  notes: "",
};

export function ManualTransactionDialog({ open, onOpenChange, onSubmit, isSubmitting }: ManualTransactionDialogProps) {
  const form = useForm<ManualTransactionFormValues>({
    resolver: zodResolver(manualTransactionSchema),
    defaultValues,
  });

  const selectedUserId = form.watch("userId");
  const selectedProductId = form.watch("productId");

  const { data: members = [], isLoading: isLoadingMembers } = useQuery<MemberOption[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
    enabled: open,
  });

  const { data: products = [] } = useQuery<ProductOption[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await fetch("/api/public/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: open,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(defaultValues);
  }, [open, form]);

  React.useEffect(() => {
    if (!selectedUserId) return;
    const member = members.find((item) => item.id === selectedUserId);
    if (!member) return;
    form.setValue("customerEmail", member.email ?? "");
    form.setValue("customerName", member.name ?? "");
    form.setValue("customerPhone", member.phoneNo ?? "");
  }, [selectedUserId, members, form]);

  React.useEffect(() => {
    if (!selectedProductId) return;
    const product = products.find((item) => item.id === selectedProductId);
    if (!product) return;
    form.setValue("amount", Number(product.price));
  }, [selectedProductId, products, form]);

  async function handleSubmit(values: ManualTransactionFormValues) {
    try {
      await onSubmit(values);
      toast.success("Manual transaction created");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create transaction");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[95vh] sm:max-w-4xl sm:rounded-lg">
        <DialogHeader className="border-b px-4 py-3 pr-10 sm:px-6 sm:py-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ReceiptText className="text-primary h-5 w-5 shrink-0" />
            <span className="truncate">Add Manual Transaction</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Record a transaction made outside the payment gateway. A matching membership will be linked automatically.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-5">
              <Section
                icon={<Users className="h-4 w-4" />}
                title="Member"
                description="Pick an existing member or create one on the fly by email."
              >
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Member (optional)</FormLabel>
                      <FormControl>
                        <MemberCombobox
                          members={members}
                          value={field.value}
                          onValueChange={(value) => field.onChange(value)}
                          placeholder={isLoadingMembers ? "Loading members..." : "Search member by name or email..."}
                          disabled={isLoadingMembers}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <InputWithIcon icon={<UserIcon className="h-4 w-4" />} placeholder="Full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <InputWithIcon
                            icon={<Mail className="h-4 w-4" />}
                            type="email"
                            placeholder="email@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <InputWithIcon icon={<Phone className="h-4 w-4" />} placeholder="+628xxxxxxxxxx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section
                icon={<Package className="h-4 w-4" />}
                title="Product & Amount"
                description="Choose the product; amount auto-fills but you can override it."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount (IDR)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium">
                              Rp
                            </span>
                            <CurrencyInput
                              placeholder="0"
                              className="h-10 pl-9 tabular-nums"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section
                icon={<Wallet className="h-4 w-4" />}
                title="Payment"
                description="Record the payment status and method used."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="text-muted-foreground h-4 w-4" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {formatStatusLabel(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <div className="flex items-center gap-2">
                                <CreditCard className="text-muted-foreground h-4 w-4" />
                                <SelectValue placeholder="Select method" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethodOptions.map((method) => (
                              <SelectItem key={method} value={method}>
                                {formatPaymentMethodLabel(method)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Provider</FormLabel>
                        <Select value={field.value ?? ""} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-10 w-full">
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentProviderOptions.map((provider) => (
                              <SelectItem key={provider} value={provider}>
                                {formatPaymentMethodLabel(provider)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paidAt"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel>Paid At</FormLabel>
                        <FormControl>
                          <DateTimePicker value={field.value ?? ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Section>

              <Section
                icon={<FileText className="h-4 w-4" />}
                title="Notes"
                description="Optional context for finance records."
              >
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea placeholder="Any context about this transaction..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Transaction"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ icon, title, description, children }: SectionProps) {
  return (
    <section className="space-y-3 sm:space-y-4">
      <div className="flex items-start gap-2">
        <div className="bg-muted text-muted-foreground mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-4 md:pl-9">{children}</div>
    </section>
  );
}

interface InputWithIconProps extends React.ComponentProps<"input"> {
  icon: React.ReactNode;
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(function InputWithIcon(
  { icon, className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">{icon}</span>
      <Input ref={ref} className={`h-10 pl-9 ${className ?? ""}`} {...props} />
    </div>
  );
});

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
}

function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const date = value ? new Date(value) : undefined;
  const timeValue = date ? format(date, "HH:mm") : "";

  function handleDateSelect(next: Date | undefined) {
    if (!next) {
      onChange("");
      return;
    }
    const base = date ?? new Date();
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
    onChange(next.toISOString());
  }

  function handleTimeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const [rawHours, rawMinutes] = event.target.value.split(":").map(Number);
    const hours = Number.isNaN(rawHours) ? 0 : rawHours;
    const minutes = Number.isNaN(rawMinutes) ? 0 : rawMinutes;
    const base = date ?? new Date();
    base.setHours(hours, minutes, 0, 0);
    onChange(base.toISOString());
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("h-10 w-full justify-start px-3 text-left font-normal", !date && "text-muted-foreground")}
        >
          <CalendarClock className="text-muted-foreground mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{date ? format(date, "MMM d, yyyy · HH:mm") : "Pick date & time"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
        <div className="flex items-center gap-2 border-t p-3">
          <CalendarClock className="text-muted-foreground h-4 w-4" />
          <Input type="time" value={timeValue} onChange={handleTimeChange} className="h-9" />
          {date ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

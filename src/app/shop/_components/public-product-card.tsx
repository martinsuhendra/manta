"use client";

import * as React from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Package } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMidtransSnap } from "@/lib/hooks/use-midtrans-snap";
import { formatPrice } from "@/lib/utils";

import { SignUpDialog } from "./sign-up-dialog";

interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  validDays: number;
  image: string | null;
  paymentUrl: string | null;
  whatIsIncluded: string | null;
  features: string[];
  createdAt: string;
}

interface PublicProductCardProps {
  product: PublicProduct;
}

const purchaseFormSchema = z.object({
  customerEmail: z.string().email("Please enter a valid email address"),
  customerName: z.string().min(1, "Name is required"),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

export function PublicProductCard({ product }: PublicProductCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { isLoaded: isSnapLoaded, openSnap } = useMidtransSnap();

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      customerEmail: "",
      customerName: "",
    },
  });

  // Auto-fill form when dialog opens and user is signed in
  React.useEffect(() => {
    if (isDialogOpen && session?.user) {
      form.reset({
        customerName: session.user.name || "",
        customerEmail: session.user.email || "",
      });
    } else if (isDialogOpen && !session?.user) {
      form.reset({
        customerEmail: "",
        customerName: "",
      });
    }
  }, [isDialogOpen, session, form]);

  const handlePurchase = async (data: PurchaseFormValues) => {
    setIsPurchasing(true);
    try {
      const response = await fetch("/api/public/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          customerEmail: data.customerEmail,
          customerName: data.customerName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Purchase failed", {
          description: result.error || "Something went wrong. Please try again.",
        });
        return;
      }

      // Check if Snap is loaded
      if (!isSnapLoaded) {
        toast.error("Payment gateway not ready", {
          description: "Please wait a moment and try again.",
        });
        return;
      }

      // Close dialog and open Snap payment
      setIsDialogOpen(false);
      form.reset();

      // Open Snap payment popup
      if (result.snapToken) {
        openSnap(result.snapToken, {
          onSuccess: () => {
            toast.success("Payment successful!", {
              description: "Your membership has been activated.",
            });
            router.push("/shop/my-account");
          },
          onPending: () => {
            toast.info("Payment pending", {
              description: "Waiting for payment confirmation. You can check the status in My Account.",
            });
            router.push("/shop/my-account");
          },
          onError: () => {
            toast.error("Payment failed", {
              description: "Please try again or contact support.",
            });
          },
          onClose: () => {
            // User closed the popup
            toast.info("Payment cancelled", {
              description: "You can continue the payment from My Account.",
            });
          },
        });
      }
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="bg-muted relative mb-4 aspect-video overflow-hidden rounded-lg border">
          {product.image ? (
            <Image src={product.image} alt={product.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="text-muted-foreground h-12 w-12" />
            </div>
          )}
        </div>
        <CardTitle className="text-xl">{product.name}</CardTitle>
        {product.description && <CardDescription className="mt-2">{product.description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{formatPrice(product.price)}</div>
          <div className="text-muted-foreground text-sm">{product.validDays} days validity</div>
        </div>

        {product.features.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Features:</h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {product.whatIsIncluded && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 h-auto justify-between p-0 text-sm font-medium hover:bg-transparent"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              What&apos;s Included?
              {isExpanded ? <span className="ml-2 text-xs">▲</span> : <span className="ml-2 text-xs">▼</span>}
            </Button>
            {isExpanded && (
              <div
                className="text-muted-foreground prose prose-sm max-w-none text-sm [&_li]:ml-0 [&_ol]:ml-3 [&_ol]:list-decimal [&_ul]:ml-3 [&_ul]:list-disc"
                dangerouslySetInnerHTML={{ __html: product.whatIsIncluded }}
              />
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!session ? (
          <SignUpDialog>
            <Button className="w-full" variant="default">
              Purchase Now
            </Button>
          </SignUpDialog>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full" variant="default">
                Purchase Now
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purchase {product.name}</DialogTitle>
                <DialogDescription>
                  Enter your information to complete your membership purchase. You&apos;ll be redirected to complete
                  payment.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handlePurchase)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" disabled={!!session.user} {...field} />
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
                          <Input type="email" placeholder="john@example.com" disabled={!!session.user} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <span className="text-lg font-bold">{formatPrice(product.price)}</span>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      Valid for {product.validDays} days from purchase date
                    </p>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isPurchasing}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPurchasing || !isSnapLoaded}>
                      {isPurchasing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : !isSnapLoaded ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading Payment...
                        </>
                      ) : (
                        "Continue to Payment"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
}

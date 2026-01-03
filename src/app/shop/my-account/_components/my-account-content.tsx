"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, CreditCard, Edit, Mail, Phone, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
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
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";
import { formatPrice } from "@/lib/utils";

interface AccountData {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNo: string | null;
    role: string;
    createdAt: string;
  };
  activeMembership: {
    id: string;
    status: string;
    joinDate: string;
    expiredAt: string;
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
  } | null;
  allMemberships: Array<{
    id: string;
    status: string;
    joinDate: string;
    expiredAt: string;
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
  }>;
  purchaseHistory: Array<{
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
  }>;
}

interface MyAccountContentProps {
  accountData: AccountData;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusBadge(status: string) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    EXPIRED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        statusColors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

const editProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNo: z.string().min(1, "Phone number is required"),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export function MyAccountContent({ accountData }: MyAccountContentProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: accountData.user.name || "",
      phoneNo: accountData.user.phoneNo || "",
    },
  });

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/shop" });
  };

  const handleEdit = () => {
    form.reset({
      name: accountData.user.name || "",
      phoneNo: accountData.user.phoneNo || "",
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = async (data: EditProfileFormValues) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/shop/my-account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error("Update failed", {
          description: result.error || "Something went wrong. Please try again.",
        });
        return;
      }

      toast.success("Profile updated successfully!");
      setIsEditDialogOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/shop" className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{APP_CONFIG.name}</h1>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/shop">
              <Button variant="ghost" size="sm">
                Back to Shop
              </Button>
            </Link>
            {session && (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            )}
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground mt-2">Manage your account details and view your membership</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Member Details */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Member Details</CardTitle>
                  <CardDescription>Your account information</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-muted-foreground text-sm">{accountData.user.name || "Not set"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Mail className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground text-sm">{accountData.user.email || "Not set"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Phone className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-muted-foreground text-sm">{accountData.user.phoneNo || "Not set"}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-3">
                <Calendar className="text-muted-foreground mt-0.5 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-muted-foreground text-sm">{formatDate(accountData.user.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Profile Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Update your account information. Please contact admin for support.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input id="name" type="text" placeholder="John Doe" autoComplete="name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input id="phoneNo" type="tel" placeholder="+1234567890" autoComplete="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="bg-muted rounded-lg p-4">
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          value={accountData.user.email || ""}
                          disabled
                          className="bg-background"
                        />
                      </FormControl>
                      <p className="text-muted-foreground text-xs">Please contact admin for support</p>
                    </FormItem>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Updating..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Active Membership */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Active Membership</CardTitle>
              <CardDescription>Your current membership status</CardDescription>
            </CardHeader>
            <CardContent>
              {accountData.activeMembership ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{accountData.activeMembership.product.name}</h3>
                    {getStatusBadge(accountData.activeMembership.status)}
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">Join Date</p>
                      <p className="font-medium">{formatDate(accountData.activeMembership.joinDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Expires On</p>
                      <p className="font-medium">{formatDate(accountData.activeMembership.expiredAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">Price</p>
                      <p className="font-medium">
                        {formatPrice(accountData.activeMembership.product.price)} /{" "}
                        {accountData.activeMembership.product.validDays} days
                      </p>
                    </div>
                    {accountData.activeMembership.transaction && (
                      <div>
                        <p className="text-muted-foreground text-sm">Payment Status</p>
                        {getStatusBadge(accountData.activeMembership.transaction.status)}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">You don&apos;t have an active membership</p>
                  <Link href="/shop">
                    <Button>Browse Plans</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase History */}
        {accountData.purchaseHistory.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>Your transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountData.purchaseHistory.map((transaction) => (
                  <div key={transaction.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CreditCard className="text-muted-foreground h-4 w-4" />
                          <h4 className="font-medium">{transaction.product.name}</h4>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="text-muted-foreground mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p>Amount: {formatPrice(transaction.amount)}</p>
                            {transaction.paymentMethod && <p>Method: {transaction.paymentMethod}</p>}
                          </div>
                          <div>
                            <p>Date: {formatDate(transaction.createdAt)}</p>
                            {transaction.paidAt && <p>Paid: {formatDate(transaction.paidAt)}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Memberships */}
        {accountData.allMemberships.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>All Memberships</CardTitle>
              <CardDescription>Your complete membership history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accountData.allMemberships.map((membership) => (
                  <div key={membership.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{membership.product.name}</h4>
                          {getStatusBadge(membership.status)}
                        </div>
                        <div className="text-muted-foreground mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p>Join Date: {formatDate(membership.joinDate)}</p>
                            <p>Expires: {formatDate(membership.expiredAt)}</p>
                          </div>
                          <div>
                            <p>Price: {formatPrice(membership.product.price)}</p>
                            {membership.transaction && (
                              <div className="mt-1">
                                <span className="text-muted-foreground text-sm">Payment: </span>
                                {getStatusBadge(membership.transaction.status)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-muted-foreground text-center text-sm">
            <p>{APP_CONFIG.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

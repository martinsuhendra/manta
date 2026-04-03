"use client";

import * as React from "react";

import { BadgeCheck, Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, getInitials } from "@/lib/utils";

const ACCOUNT_MENU_ITEMS = [
  {
    icon: BadgeCheck,
    label: "Account",
  },
  {
    icon: Bell,
    label: "Notifications",
  },
] as const;

const LOGOUT_MENU_ITEM = {
  icon: LogOut,
  label: "Log out",
} as const;

interface AccountUser {
  readonly name: string;
  readonly email: string;
  readonly avatar: string;
}

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AccountUser;
}

function AccountDialog({ open, onOpenChange, user }: AccountDialogProps) {
  const [name, setName] = React.useState(user.name);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(user.name);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }, [open, user.name]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword.length < 6) {
        toast.error("New password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New password and confirmation do not match");
        return;
      }

      if (!currentPassword) {
        toast.error("Current password is required to change password");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update account");
        return;
      }

      toast.success("Account updated");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update account", error);
      toast.error("Something went wrong while updating your account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>Account settings</DialogTitle>
            <DialogDescription>Update your display name and password.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-switcher-name">Name</Label>
              <Input
                id="account-switcher-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-switcher-current-password">Current password</Label>
              <Input
                id="account-switcher-current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-switcher-new-password">New password</Label>
                <Input
                  id="account-switcher-new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-switcher-confirm-password">Confirm new password</Label>
                <Input
                  id="account-switcher-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AccountSwitcher({ users }: { readonly users: ReadonlyArray<AccountUser> }) {
  const [activeUser, setActiveUser] = React.useState<AccountUser>(users[0]);
  const [isAccountOpen, setIsAccountOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/sign-in",
      redirect: true,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="size-9 cursor-pointer rounded-lg">
            <AvatarImage src={activeUser.avatar || undefined} alt={activeUser.name} />
            <AvatarFallback className="rounded-lg">{getInitials(activeUser.name)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
          {users.map((user, index) => (
            <DropdownMenuItem
              key={user.email}
              className={cn("p-0", index === 0 && "bg-accent/50 border-l-primary border-l-2")}
              onClick={() => setActiveUser(user)}
            >
              <div className="flex w-full items-center justify-between gap-2 px-1 py-1.5">
                <Avatar className="size-9 rounded-lg">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="rounded-lg">{getInitials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {ACCOUNT_MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const handleClick =
                item.label === "Account"
                  ? () => {
                      setIsAccountOpen(true);
                    }
                  : undefined;

              return (
                <DropdownMenuItem key={item.label} onClick={handleClick}>
                  <Icon />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LOGOUT_MENU_ITEM.icon />
            {LOGOUT_MENU_ITEM.label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountDialog open={isAccountOpen} onOpenChange={setIsAccountOpen} user={activeUser} />
    </>
  );
}

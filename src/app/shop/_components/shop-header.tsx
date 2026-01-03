"use client";

import Link from "next/link";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";

import { SignInDialog } from "./sign-in-dialog";
import { SignUpDialog } from "./sign-up-dialog";

interface ShopHeaderProps {
  session: Session | null;
}

export function ShopHeader({ session }: ShopHeaderProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/shop" });
  };

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/shop" className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{APP_CONFIG.name}</h1>
        </Link>
        <nav className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/shop/my-account">
                <Button variant="ghost" size="sm">
                  My Account
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <SignInDialog>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInDialog>
              <SignUpDialog>
                <Button size="sm">Sign Up</Button>
              </SignUpDialog>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

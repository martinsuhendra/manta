"use client";

import { useEffect, useState } from "react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          {!mounted ? (
            <div className="bg-muted h-9 w-24 animate-pulse rounded-md" />
          ) : session ? (
            <>
              {session.user.role === "MEMBER" && (
                <Link href="/shop/book">
                  <Button variant="ghost" size="sm">
                    Book a class
                  </Button>
                </Link>
              )}
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

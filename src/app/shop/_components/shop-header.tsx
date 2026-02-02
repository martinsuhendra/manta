"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { cn } from "@/lib/utils";

import { SignInDialog } from "./sign-in-dialog";
import { SignUpDialog } from "./sign-up-dialog";

interface ShopHeaderProps {
  session: Session | null;
}

export function ShopHeader({ session }: ShopHeaderProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Pages that start with a dark section where we want transparent header
  const isDarkHeroPage = pathname === "/shop" || pathname === "/shop/schedule";

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/shop" });
  };

  const isTransparent = isDarkHeroPage && !isScrolled;

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled
          ? "border-border/40 bg-background/80 border-b py-2 shadow-sm backdrop-blur-md"
          : isDarkHeroPage
            ? "border-transparent bg-transparent py-4"
            : "bg-background/80 border-border/40 border-b py-4 backdrop-blur-md",
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/shop" className="group flex items-center gap-2">
          <div className="bg-primary text-primary-foreground relative flex h-8 w-8 items-center justify-center rounded-lg font-bold transition-transform group-hover:scale-110">
            {APP_CONFIG.name.substring(0, 1)}
          </div>
          <span className={cn("text-xl font-bold tracking-tight transition-colors", isTransparent && "text-white")}>
            {APP_CONFIG.name}
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {!mounted ? (
            <div className="bg-muted h-9 w-24 animate-pulse rounded-md" />
          ) : session ? (
            <>
              {session.user.role === "MEMBER" && (
                <Link href="/shop/book">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "transition-colors",
                      isTransparent && "text-white hover:bg-white/10 hover:text-white",
                    )}
                  >
                    Book a class
                  </Button>
                </Link>
              )}
              <Link href="/shop/my-account">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("transition-colors", isTransparent && "text-white hover:bg-white/10 hover:text-white")}
                >
                  My Account
                </Button>
              </Link>
              <Button variant={isTransparent ? "secondary" : "outline"} size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <SignInDialog>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("transition-colors", isTransparent && "text-white hover:bg-white/10 hover:text-white")}
                >
                  Sign In
                </Button>
              </SignInDialog>
              <SignUpDialog>
                <Button size="sm" variant={isTransparent ? "secondary" : "default"}>
                  Sign Up
                </Button>
              </SignUpDialog>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

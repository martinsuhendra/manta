"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Calendar, LogIn, LogOut, User, UserPlus } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [isOpen, setIsOpen] = useState(false);

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
          ? "border-border/40 bg-background/80 border-b shadow-sm backdrop-blur-md"
          : isDarkHeroPage
            ? "border-transparent bg-transparent"
            : "bg-background/80 border-border/40 border-b backdrop-blur-md",
      )}
    >
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-4">
        <Link href="/shop" className="group flex shrink-0 items-center gap-2">
          <div className="bg-primary text-primary-foreground relative flex h-8 w-8 items-center justify-center rounded-lg font-bold transition-transform group-hover:scale-110">
            {APP_CONFIG.name.substring(0, 1)}
          </div>
          <span
            className={cn(
              "text-base font-bold tracking-tight transition-colors sm:text-xl",
              isTransparent && "text-white",
            )}
          >
            {APP_CONFIG.name}
          </span>
        </Link>

        <nav className="hidden items-center justify-end gap-2 sm:gap-4 md:flex">
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

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("transition-colors", isTransparent && "text-white hover:bg-white/10 hover:text-white")}
              >
                <span className="relative flex h-6 w-6 flex-col items-center justify-center" aria-hidden>
                  <span
                    className={cn(
                      "absolute left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-current transition-all duration-300 ease-out",
                      isOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[5px]",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute top-1/2 left-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-all duration-300 ease-out",
                      isOpen && "scale-x-0 opacity-0",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute bottom-[5px] left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-current transition-all duration-300 ease-out",
                      isOpen ? "bottom-1/2 translate-y-1/2 -rotate-45" : "",
                    )}
                  />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuLabel className="font-normal">
                {mounted && session ? (
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm leading-none font-medium">{session.user.name}</p>
                    <p className="text-muted-foreground text-xs leading-none">{session.user.email}</p>
                  </div>
                ) : (
                  <span className="font-semibold">{APP_CONFIG.name}</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!mounted ? (
                <div className="space-y-2 p-2">
                  <div className="bg-muted h-8 w-full animate-pulse rounded-md" />
                  <div className="bg-muted h-8 w-3/4 animate-pulse rounded-md" />
                </div>
              ) : session ? (
                <DropdownMenuGroup>
                  {session.user.role === "MEMBER" && (
                    <Link href="/shop/book">
                      <DropdownMenuItem className="cursor-pointer">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Book a class</span>
                      </DropdownMenuItem>
                    </Link>
                  )}
                  <Link href="/shop/my-account">
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Account</span>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => handleSignOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              ) : (
                <DropdownMenuGroup>
                  <SignInDialog>
                    <DropdownMenuItem className="cursor-pointer">
                      <LogIn className="mr-2 h-4 w-4" />
                      <span>Sign In</span>
                    </DropdownMenuItem>
                  </SignInDialog>
                  <SignUpDialog>
                    <DropdownMenuItem className="cursor-pointer">
                      <UserPlus className="mr-2 h-4 w-4" />
                      <span>Sign Up</span>
                    </DropdownMenuItem>
                  </SignUpDialog>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

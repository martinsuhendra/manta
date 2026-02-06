"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Calendar, LogIn, LogOut, Menu, User, UserPlus } from "lucide-react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("transition-colors", isTransparent && "text-white hover:bg-white/10 hover:text-white")}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col gap-0 px-0 sm:max-w-xs">
              <SheetHeader className="border-b px-6 py-4 text-left">
                <SheetTitle className="flex items-center gap-2">
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg font-bold">
                    {APP_CONFIG.name.substring(0, 1)}
                  </div>
                  {APP_CONFIG.name}
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-1 px-2 py-4">
                {!mounted ? (
                  <div className="space-y-4 px-4">
                    <div className="bg-muted h-12 w-full animate-pulse rounded-md" />
                    <div className="bg-muted h-8 w-3/4 animate-pulse rounded-md" />
                    <div className="bg-muted h-8 w-1/2 animate-pulse rounded-md" />
                  </div>
                ) : session ? (
                  <>
                    <div className="mb-4 flex items-center gap-3 px-4 py-2">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                        <AvatarFallback>{session.user.name?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-semibold">{session.user.name}</span>
                        <span className="text-muted-foreground truncate text-xs">{session.user.email}</span>
                      </div>
                    </div>

                    <Separator className="mb-2" />

                    {session.user.role === "MEMBER" && (
                      <Link href="/shop/book" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" className="h-12 w-full justify-start gap-3 text-base font-normal">
                          <Calendar className="h-5 w-5" />
                          Book a class
                        </Button>
                      </Link>
                    )}
                    <Link href="/shop/my-account" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="h-12 w-full justify-start gap-3 text-base font-normal">
                        <User className="h-5 w-5" />
                        My Account
                      </Button>
                    </Link>

                    <div className="mt-auto">
                      <Separator className="my-2" />
                      <Button
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-12 w-full justify-start gap-3 text-base font-normal"
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <SignInDialog>
                      <Button
                        variant="ghost"
                        className="h-12 w-full justify-start gap-3 text-base font-normal"
                        onClick={() => {}}
                      >
                        <LogIn className="h-5 w-5" />
                        Sign In
                      </Button>
                    </SignInDialog>
                    <SignUpDialog>
                      <Button variant="ghost" className="h-12 w-full justify-start gap-3 text-base font-normal">
                        <UserPlus className="h-5 w-5" />
                        Sign Up
                      </Button>
                    </SignUpDialog>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

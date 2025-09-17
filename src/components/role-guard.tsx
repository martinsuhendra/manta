"use client";

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { Lock } from "lucide-react";
import { useSession } from "next-auth/react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackUrl?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackUrl = "/unauthorized" }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session) {
      // Not authenticated - redirect to sign in
      router.push("/sign-in");
      return;
    }

    const userRole = session.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      // User doesn't have required role
      router.push(fallbackUrl);
      return;
    }
  }, [session, status, allowedRoles, fallbackUrl, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Authenticating...</div>
      </div>
    );
  }

  // Show unauthorized message while redirecting
  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Lock className="text-muted-foreground mx-auto h-12 w-12" />
          <p className="text-muted-foreground mt-2">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const userRole = session.user?.role;
  if (!userRole || !allowedRoles.includes(userRole)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Lock className="text-muted-foreground mx-auto h-12 w-12" />
          <p className="text-muted-foreground mt-2">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // User has required role, show the protected content
  return <>{children}</>;
}

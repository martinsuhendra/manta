"use client";

import { RoleGuard } from "@/components/role-guard";
import { useProducts } from "@/hooks/use-products-query";
import { USER_ROLES } from "@/lib/types";

import { ProductsTable } from "./_components/products-table";

export default function Page() {
  const { data: products, isLoading, error } = useProducts();

  if (error) {
    console.error("Products fetch error:", error);

    // Check if it's an authentication error
    const isAuthError = error.message.includes("401") || error.message.includes("Unauthorized");

    return (
      <RoleGuard allowedRoles={[USER_ROLES.SUPERADMIN]}>
        <div className="@container/main flex flex-col gap-4 md:gap-6">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold">
                {isAuthError ? "Authentication Required" : "Error Loading Products"}
              </h3>
              <p className="text-muted-foreground mt-2">
                {isAuthError
                  ? "Please sign in to access the products page. The database was recently reset and you may need to log in again."
                  : error.message}
              </p>
              {isAuthError ? (
                <div className="mt-4 space-y-2">
                  <p className="text-muted-foreground text-sm">Super Admin Credentials:</p>
                  <p className="bg-muted rounded p-2 font-mono text-sm">
                    Email: superadmin@example.com
                    <br />
                    Password: password123
                  </p>
                  <button
                    onClick={() => (window.location.href = "/sign-in")}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded-md px-4 py-2"
                  >
                    Go to Sign In
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded-md px-4 py-2"
                >
                  Refresh Page
                </button>
              )}
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={[USER_ROLES.SUPERADMIN]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <ProductsTable data={products || []} isLoading={isLoading} />
      </div>
    </RoleGuard>
  );
}

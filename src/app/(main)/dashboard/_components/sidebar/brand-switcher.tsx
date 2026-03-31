"use client";

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useAccessibleBrands } from "@/hooks/use-brands-query";
import { useBrandStore } from "@/stores/brand/brand-provider";

const ALL_ID = "ALL" as const;

export function BrandSwitcher() {
  const queryClient = useQueryClient();
  const { data: brands = [], isLoading } = useAccessibleBrands();
  const activeBrandId = useBrandStore((s) => s.activeBrandId);
  const setActiveBrand = useBrandStore((s) => s.setActiveBrand);
  const setBrands = useBrandStore((s) => s.setBrands);

  useEffect(() => {
    if (brands.length) setBrands(brands);
  }, [brands, setBrands]);

  const handleSelect = (id: string | typeof ALL_ID) => {
    setActiveBrand(id);
    queryClient.invalidateQueries();
  };

  if (isLoading || brands.length === 0) return null;

  const showAllOption = brands.length >= 2;
  const currentLabel =
    activeBrandId === ALL_ID ? "All Brands" : (brands.find((b) => b.id === activeBrandId)?.name ?? "Select brand");
  const currentColor = activeBrandId !== ALL_ID ? brands.find((b) => b.id === activeBrandId)?.primaryColor : undefined;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={currentLabel}>
              {activeBrandId === ALL_ID ? (
                <Building2 className="h-4 w-4 shrink-0" />
              ) : (
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full border"
                  style={{ backgroundColor: currentColor ?? "#6366f1" }}
                />
              )}
              <span className="truncate group-data-[collapsible=icon]:hidden">{currentLabel}</span>
              <ChevronsUpDown className="ml-auto h-4 w-4 flex-shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start" className="min-w-[200px]">
            {showAllOption && (
              <>
                <DropdownMenuItem onClick={() => handleSelect(ALL_ID)}>
                  <Building2 className="mr-2 h-4 w-4" />
                  All Brands
                  {activeBrandId === ALL_ID && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {brands.map((b) => (
              <DropdownMenuItem key={b.id} onClick={() => handleSelect(b.id)}>
                <span
                  className="mr-2 h-2.5 w-2.5 flex-shrink-0 rounded-full border"
                  style={{ backgroundColor: b.primaryColor ?? "#6366f1" }}
                />
                <span className="truncate">{b.name}</span>
                {activeBrandId === b.id && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

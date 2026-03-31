"use client";

import { useState } from "react";

import Link from "next/link";

import { MoreHorizontal, Pencil, Power } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BrandAdmin } from "@/hooks/use-brands-query";

import { DeactivateBrandDialog } from "./deactivate-brand-dialog";

interface BrandsTableProps {
  data: BrandAdmin[];
  isLoading: boolean;
}

export function BrandsTable({ data, isLoading }: BrandsTableProps) {
  const [brandToDeactivate, setBrandToDeactivate] = useState<BrandAdmin | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <div className="text-muted-foreground flex h-[200px] items-center justify-center">Loading brands…</div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                  No brands yet. Add your first brand to get started.
                </TableCell>
              </TableRow>
            ) : (
              data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 flex-shrink-0 rounded-full border"
                        style={{ backgroundColor: b.primaryColor }}
                      />
                      <span className="font-medium">{b.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground font-mono text-sm">{b.slug}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground max-w-[200px] truncate" title={b.address ?? undefined}>
                      {b.address ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {b.isActive ? <Badge variant="default">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/brands/${b.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {b.isActive && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setBrandToDeactivate(b)}>
                              <Power className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <DeactivateBrandDialog
        brand={brandToDeactivate}
        open={!!brandToDeactivate}
        onOpenChange={(open) => !open && setBrandToDeactivate(null)}
      />
    </>
  );
}

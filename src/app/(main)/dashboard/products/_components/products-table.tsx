"use client";

import * as React from "react";

import { Grid3X3, Table } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { createProductColumns } from "./columns";
import { DeleteProductDialog } from "./delete-product-dialog";
import { AddProductDialog, ProductFormDialog } from "./product-form-dialog";
import { ProductsGrid } from "./products-grid";
import { ProductsSearch } from "./products-search";
import { ProductsTableSkeleton } from "./products-table-skeleton";
import { Product } from "./schema";
import { StatusFilter } from "./status-filter";
import { ViewProductDialog } from "./view-product-dialog";

interface ProductsTableProps {
  data: Product[];
  isLoading: boolean;
}

export function ProductsTable({ data, isLoading }: ProductsTableProps) {
  const [viewMode, setViewMode] = React.useState<"card" | "table">("card");
  const [selectedStatus, setSelectedStatus] = React.useState("all");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [viewProductOpen, setViewProductOpen] = React.useState(false);
  const [editProductOpen, setEditProductOpen] = React.useState(false);
  const [deleteProductOpen, setDeleteProductOpen] = React.useState(false);

  const filteredData = React.useMemo(() => {
    if (selectedStatus === "all") {
      return data;
    }
    const isActive = selectedStatus === "active";
    return data.filter((product) => product.isActive === isActive);
  }, [data, selectedStatus]);

  const actions = React.useMemo(
    () => ({
      onViewProduct: (product: Product) => {
        setSelectedProduct(product);
        setViewProductOpen(true);
      },
      onEditProduct: (product: Product) => {
        setSelectedProduct(product);
        setEditProductOpen(true);
      },
      onDeleteProduct: (product: Product) => {
        setSelectedProduct(product);
        setDeleteProductOpen(true);
      },
    }),
    [],
  );

  const columns = React.useMemo(() => createProductColumns(actions), [actions]);

  const table = useDataTableInstance({
    data: filteredData,
    columns,
    getRowId: (row) => row.id,
  });

  if (isLoading) return <ProductsTableSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">Manage product packages and pricing</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "card" | "table")}
            variant="outline"
          >
            <ToggleGroupItem value="card" aria-label="Card view">
              <Grid3X3 className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Table view">
              <Table className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {viewMode === "table" && <DataTableViewOptions table={table} />}
          <AddProductDialog />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ProductsSearch
            value={viewMode === "table" ? (table.getState().globalFilter ?? "") : ""}
            onChange={(value) => viewMode === "table" && table.setGlobalFilter(value)}
            placeholder="Search by name or description..."
          />
          <StatusFilter selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} />
        </div>
        <div className="text-muted-foreground text-sm">
          {viewMode === "table" ? table.getFilteredRowModel().rows.length : filteredData.length} of {data.length}{" "}
          product(s)
        </div>
      </div>

      {viewMode === "card" ? (
        <ProductsGrid
          data={filteredData}
          isLoading={isLoading}
          onViewProduct={actions.onViewProduct}
          onEditProduct={actions.onEditProduct}
          onDeleteProduct={actions.onDeleteProduct}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border">
            <DataTable table={table} columns={columns} />
          </div>
          <DataTablePagination table={table} />
        </>
      )}

      <ViewProductDialog product={selectedProduct} open={viewProductOpen} onOpenChange={setViewProductOpen} />
      <ProductFormDialog
        mode="edit"
        product={selectedProduct}
        open={editProductOpen}
        onOpenChange={setEditProductOpen}
      />
      <DeleteProductDialog product={selectedProduct} open={deleteProductOpen} onOpenChange={setDeleteProductOpen} />
    </div>
  );
}

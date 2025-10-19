"use client";

import * as React from "react";

import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { createItemColumns } from "./columns";
import { DeleteItemDialog } from "./delete-item-dialog";
import { ItemDialog } from "./item-dialog";
import { ItemsTableSkeleton } from "./items-table-skeleton";
import { Item } from "./schema";
import { ViewItemDialog } from "./view-item-dialog";

export function ItemsTable() {
  const [selectedItems] = React.useState<Item[]>([]);
  const [itemToView, setItemToView] = React.useState<Item | null>(null);
  const [itemDialogState, setItemDialogState] = React.useState<Item | "new" | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<Item | null>(null);

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ["admin-items"],
    queryFn: async () => {
      const response = await fetch("/api/admin/items?includeSchedules=true&includeTeachers=true");
      if (!response.ok) throw new Error("Failed to fetch items");
      return response.json();
    },
  });

  const actions = {
    onViewItem: setItemToView,
    onEditItem: setItemDialogState,
    onDeleteItem: setItemToDelete,
  };

  const columns = createItemColumns(actions);

  const tableInstance = useDataTableInstance({
    data: items,
    columns,
    defaultPageSize: 10,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <span className="text-muted-foreground text-sm">{selectedItems.length} item(s) selected</span>
          )}
        </div>
        <Button onClick={() => setItemDialogState("new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {isLoading ? <ItemsTableSkeleton /> : <DataTable table={tableInstance} columns={columns} />}

      <ItemDialog
        item={itemDialogState === "new" ? undefined : itemDialogState || undefined}
        open={itemDialogState !== null}
        onOpenChange={(open) => !open && setItemDialogState(null)}
      />

      <ViewItemDialog item={itemToView} open={!!itemToView} onOpenChange={(open) => !open && setItemToView(null)} />

      <DeleteItemDialog
        item={itemToDelete}
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      />
    </>
  );
}

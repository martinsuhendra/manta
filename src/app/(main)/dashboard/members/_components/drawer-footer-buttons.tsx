import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DrawerClose, DrawerFooter } from "@/components/ui/drawer";

interface DrawerFooterButtonsProps {
  mode: "view" | "edit" | "add";
  canDelete: boolean;
  isPending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function DrawerFooterButtons({ mode, canDelete, isPending, onEdit, onDelete }: DrawerFooterButtonsProps) {
  if (mode === "view") {
    return (
      <DrawerFooter className="gap-2">
        <Button variant="outline" onClick={onEdit} className="w-full">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Member
        </Button>
        <Button variant="destructive" onClick={onDelete} disabled={!canDelete} className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Member
        </Button>
      </DrawerFooter>
    );
  }

  const buttonText =
    mode === "add" ? (isPending ? "Creating..." : "Create Member") : isPending ? "Updating..." : "Update Member";

  return (
    <DrawerFooter className="gap-2">
      <Button type="submit" form="member-form" disabled={isPending} className="flex-1">
        {buttonText}
      </Button>
      <DrawerClose asChild>
        <Button type="button" variant="outline" disabled={isPending}>
          Cancel
        </Button>
      </DrawerClose>
    </DrawerFooter>
  );
}

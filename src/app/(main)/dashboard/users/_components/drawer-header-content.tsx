import { Pencil, Plus, User } from "lucide-react";

import { DrawerDescription, DrawerTitle } from "@/components/ui/drawer";

type DrawerMode = "view" | "edit" | "add";

interface DrawerHeaderContentProps {
  mode: DrawerMode;
  canEditRoles: boolean;
}

const MODE_CONFIG = {
  add: {
    title: "Add New Member",
    description: "Create a new member account. Fill in the required information below.",
    icon: Plus,
  },
  edit: {
    title: "Edit Member",
    description: (canEditRoles: boolean) =>
      `Update member information and settings.${!canEditRoles ? " (Role editing requires SUPERADMIN privileges)" : ""}`,
    icon: Pencil,
  },
  view: {
    title: "Member Profile",
    description: "View member details, memberships, transactions, and attendance history.",
    icon: User,
  },
} as const;

export function DrawerHeaderContent({ mode, canEditRoles }: DrawerHeaderContentProps) {
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;
  const description = typeof config.description === "function" ? config.description(canEditRoles) : config.description;

  return (
    <>
      <DrawerTitle className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        {config.title}
      </DrawerTitle>
      <DrawerDescription>{description}</DrawerDescription>
    </>
  );
}

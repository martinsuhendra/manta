"use client";

import * as React from "react";

import { Check, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { USER_ROLES } from "@/lib/types";
import { cn } from "@/lib/utils";

const roles = [
  { value: "all", label: "All Roles" },
  { value: USER_ROLES.ADMIN, label: "Admin" },
  { value: USER_ROLES.SUPERADMIN, label: "Super Admin" },
  { value: USER_ROLES.TEACHER, label: "Teacher" },
  { value: USER_ROLES.MEMBER, label: "Member" },
];

interface RoleFilterProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

export function RoleFilter({ selectedRole, onRoleChange }: RoleFilterProps) {
  const [open, setOpen] = React.useState(false);

  const selectedRoleLabel = roles.find((role) => role.value === selectedRole)?.label ?? "All Roles";
  const hasFilter = selectedRole !== "all";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-8 border-dashed", hasFilter && "bg-accent border-solid")}>
          <Filter className="mr-2 h-4 w-4" />
          Role
          {hasFilter && (
            <>
              <div className="bg-border mx-2 h-4 w-px" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selectedRoleLabel}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search roles..." />
          <CommandList>
            <CommandEmpty>No roles found.</CommandEmpty>
            <CommandGroup>
              {roles.map((role) => (
                <CommandItem
                  key={role.value}
                  value={role.value}
                  onSelect={() => {
                    onRoleChange(role.value);
                    setOpen(false);
                  }}
                >
                  <div
                    className={cn(
                      "border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                      selectedRole === role.value
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible",
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </div>
                  <span>{role.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

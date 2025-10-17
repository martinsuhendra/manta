"use client";

import * as React from "react";

import { Check, ChevronsUpDown, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface UserComboboxProps {
  users: User[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function UserCombobox({
  users,
  value,
  onValueChange,
  placeholder = "Select a user...",
  disabled,
}: UserComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedUser = users.find((user) => user.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-16 w-full justify-between"
          disabled={disabled}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <div className="bg-muted flex h-6 w-6 items-center justify-center rounded-full">
                <User className="h-3 w-3" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{selectedUser.name || "No Name"}</span>
                <span className="text-muted-foreground text-xs">{selectedUser.email}</span>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search members by name or email..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  className="min-w-lg"
                  key={user.id}
                  value={`${user.name || ""} ${user.email || ""}`}
                  onSelect={() => {
                    onValueChange(user.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === user.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-medium">{user.name || "No Name"}</span>
                      <span className="text-muted-foreground text-xs">{user.email}</span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

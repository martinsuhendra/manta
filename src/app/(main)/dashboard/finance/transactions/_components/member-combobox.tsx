"use client";

import * as React from "react";

import { Check, ChevronsUpDown, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MemberOption {
  id: string;
  name: string | null;
  email: string | null;
}

interface MemberComboboxProps {
  members: MemberOption[];
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
}

export function MemberCombobox({
  members,
  value,
  onValueChange,
  placeholder = "Search member by name or email...",
  disabled,
  allowClear = true,
}: MemberComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = members.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-14 w-full justify-between px-3"
          disabled={disabled}
        >
          {selected ? (
            <div className="flex min-w-0 items-center gap-2">
              <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <UserIcon className="text-primary h-4 w-4" />
              </div>
              <div className="flex min-w-0 flex-col items-start">
                <span className="truncate text-sm font-medium">{selected.name ?? "No Name"}</span>
                <span className="text-muted-foreground truncate text-xs">{selected.email ?? "-"}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserIcon className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            if (!search) return 1;
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search member by name or email..." />
          <CommandList>
            <CommandEmpty>No member found.</CommandEmpty>
            {allowClear && value ? (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onValueChange(undefined);
                    setOpen(false);
                  }}
                >
                  <Check className="mr-2 h-4 w-4 opacity-0" />
                  <span className="text-muted-foreground">Clear selection (create by email)</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
            <CommandGroup>
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${member.name ?? ""} ${member.email ?? ""} ${member.id}`}
                  onSelect={() => {
                    onValueChange(member.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === member.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{member.name ?? "No Name"}</span>
                    <span className="text-muted-foreground truncate text-xs">{member.email ?? "-"}</span>
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

"use client";
import * as React from "react";

import { useRouter } from "next/navigation";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { sidebarItems } from "@/navigation/sidebar/sidebar-items";

// Transform sidebar items into search items
const getSearchItems = () => {
  const searchItems: Array<{
    group: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    url: string;
    disabled: boolean;
  }> = [];

  sidebarItems.forEach((group) => {
    group.items.forEach((item) => {
      if (item.icon) {
        searchItems.push({
          group: group.label || "Other",
          icon: item.icon,
          label: item.title,
          url: item.url,
          disabled: item.comingSoon || false,
        });
      }
    });
  });

  return searchItems;
};

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const searchItems = React.useMemo(() => getSearchItems(), []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (item: { url: string; disabled: boolean }) => {
    if (!item.disabled) {
      router.push(item.url);
    }
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="link"
        className="text-muted-foreground !px-0 font-normal hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search
        <kbd className="bg-muted inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px] font-medium select-none">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search dashboards, users, and more…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {[...new Set(searchItems.map((item) => item.group))].map((group, i) => (
            <React.Fragment key={group}>
              {i !== 0 && <CommandSeparator />}
              <CommandGroup heading={group} key={group}>
                {searchItems
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <CommandItem
                      className="cursor-pointer !py-1.5"
                      key={item.label}
                      onSelect={() => handleSelect(item)}
                      disabled={item.disabled}
                    >
                      <item.icon />
                      <span className={item.disabled ? "text-muted-foreground" : ""}>{item.label}</span>
                      {item.disabled && <span className="text-muted-foreground ml-auto text-xs">Coming Soon</span>}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

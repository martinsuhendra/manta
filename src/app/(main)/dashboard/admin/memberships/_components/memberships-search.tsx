"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface MembershipsSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MembershipsSearch({ value, onChange }: MembershipsSearchProps) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
      <Input
        placeholder="Search memberships..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-8"
      />
    </div>
  );
}

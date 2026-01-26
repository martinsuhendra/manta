"use client";

import * as React from "react";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface MembersSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MembersSearch({ value, onChange, placeholder = "Search members..." }: MembersSearchProps) {
  return (
    <div className="relative w-80 flex-1">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="pl-9" />
    </div>
  );
}

"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value="ACTIVE">Active</SelectItem>
        <SelectItem value="PENDING">Pending</SelectItem>
        <SelectItem value="EXPIRED">Expired</SelectItem>
        <SelectItem value="SUSPENDED">Suspended</SelectItem>
      </SelectContent>
    </Select>
  );
}

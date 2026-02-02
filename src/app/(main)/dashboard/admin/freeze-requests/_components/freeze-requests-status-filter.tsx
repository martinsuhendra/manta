"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FREEZE_REQUEST_STATUS, FREEZE_REQUEST_STATUS_LABELS } from "@/lib/constants/freeze";

interface FreezeRequestsStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function FreezeRequestsStatusFilter({ value, onChange }: FreezeRequestsStatusFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Status</SelectItem>
        <SelectItem value={FREEZE_REQUEST_STATUS.PENDING_APPROVAL}>
          {FREEZE_REQUEST_STATUS_LABELS[FREEZE_REQUEST_STATUS.PENDING_APPROVAL]}
        </SelectItem>
        <SelectItem value={FREEZE_REQUEST_STATUS.APPROVED}>
          {FREEZE_REQUEST_STATUS_LABELS[FREEZE_REQUEST_STATUS.APPROVED]}
        </SelectItem>
        <SelectItem value={FREEZE_REQUEST_STATUS.REJECTED}>
          {FREEZE_REQUEST_STATUS_LABELS[FREEZE_REQUEST_STATUS.REJECTED]}
        </SelectItem>
        <SelectItem value={FREEZE_REQUEST_STATUS.COMPLETED}>
          {FREEZE_REQUEST_STATUS_LABELS[FREEZE_REQUEST_STATUS.COMPLETED]}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

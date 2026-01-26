import { StatusBadge } from "@/components/ui/status-badge";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MemberDetails } from "./schema";

interface TabTriggersProps {
  memberDetails: MemberDetails | undefined;
}

export function TabTriggers({ memberDetails }: TabTriggersProps) {
  return (
    <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 w-fit **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="memberships">
        Memberships{" "}
        {memberDetails && memberDetails._count.memberships > 0 && (
          <StatusBadge variant="secondary">{memberDetails._count.memberships}</StatusBadge>
        )}
      </TabsTrigger>
      <TabsTrigger value="transactions">
        Transactions{" "}
        {memberDetails && memberDetails._count.transactions > 0 && (
          <StatusBadge variant="secondary">{memberDetails._count.transactions}</StatusBadge>
        )}
      </TabsTrigger>
      <TabsTrigger value="attendance">
        Attendance{" "}
        {memberDetails && memberDetails._count.bookings > 0 && (
          <StatusBadge variant="secondary">{memberDetails._count.bookings}</StatusBadge>
        )}
      </TabsTrigger>
    </TabsList>
  );
}

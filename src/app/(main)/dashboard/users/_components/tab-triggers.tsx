import { StatusBadge } from "@/components/ui/status-badge";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { USER_ROLES } from "@/lib/types";

import { MemberDetails } from "./schema";

interface TabTriggersProps {
  memberDetails: MemberDetails | undefined;
  memberRole: string;
}

export function TabTriggers({ memberDetails, memberRole }: TabTriggersProps) {
  const isTeacher = memberRole === USER_ROLES.TEACHER;

  if (isTeacher) {
    return (
      <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 w-fit **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="sessions">
          Sessions{" "}
          {(() => {
            const count =
              memberDetails && "classSessions" in memberDetails ? (memberDetails.classSessions?.length ?? 0) : 0;
            return count > 0 ? <StatusBadge variant="secondary">{count}</StatusBadge> : null;
          })()}
        </TabsTrigger>
      </TabsList>
    );
  }

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

import { Clock, User, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { Session } from "./schema";

const SESSION_STATUS_COLORS = {
  SCHEDULED: "#10b981",
  CANCELLED: "#ef4444",
  COMPLETED: "#3b82f6",
  IN_PROGRESS: "#f59e0b",
} as const;

interface CompactSessionCardProps {
  session: Session;
  onSessionSelect: (session: Session) => void;
}

export function CompactSessionCard({ session, onSessionSelect }: CompactSessionCardProps) {
  return (
    <div
      className="bg-card cursor-pointer rounded-lg border border-l-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      style={{ borderLeftColor: session.item.color || SESSION_STATUS_COLORS[session.status] }}
      onClick={() => onSessionSelect(session)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Main Content */}
          <div className="min-w-0 flex-1 space-y-3">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-sm"
                  style={{ backgroundColor: session.item.color || SESSION_STATUS_COLORS[session.status] }}
                />
                <h4 className="text-foreground truncate text-sm font-semibold">{session.item.name}</h4>
              </div>
              <Badge
                variant="secondary"
                className="flex-shrink-0 px-2.5 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${SESSION_STATUS_COLORS[session.status]}15`,
                  color: SESSION_STATUS_COLORS[session.status],
                  border: `1px solid ${SESSION_STATUS_COLORS[session.status]}30`,
                }}
              >
                {session.status}
              </Badge>
            </div>

            {/* Details Grid */}
            <div className="text-muted-foreground grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium">
                  {session.startTime} - {session.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {session.teacher?.name || session.teacher?.email || "No teacher assigned"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-medium">
                  {session._count?.bookings || 0} / {session.item.capacity} participants
                </span>
              </div>
            </div>

            {/* Notes */}
            {session.notes && (
              <div className="bg-muted/40 border-muted text-muted-foreground rounded-md border-l-3 p-3 text-xs italic">
                <span className="text-foreground font-medium">Note:</span> {session.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { format } from "date-fns";
import { Calendar, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { MemberSession, SessionEligibility } from "@/hooks/use-member-sessions";

interface SessionCardProps {
  session: MemberSession;
  eligibility: SessionEligibility | undefined;
  onSelect: () => void;
}

export function SessionCard({ session, eligibility, onSelect }: SessionCardProps) {
  const status = eligibility?.alreadyBooked ? "booked" : eligibility?.canJoin ? "can-join" : "cannot-join";
  const reason = eligibility?.reason;

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onSelect}>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4 sm:flex-nowrap">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: (session.item.color as string) || "var(--muted-foreground)",
              }}
            />
            <span className="font-medium">{session.item.name}</span>
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(session.date), "EEE, MMM d, yyyy")} · {session.startTime}
              {session.endTime ? ` – ${session.endTime}` : ""}
            </span>
            {session.teacher && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {session.teacher.name ?? session.teacher.email ?? "—"}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-muted-foreground text-sm whitespace-nowrap">{session.spotsLeft} spots left</span>
          {reason ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <StatusBadge status={status} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{reason}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <StatusBadge status={status} />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: "booked" | "can-join" | "cannot-join" }) {
  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function getStatusConfig(status: "booked" | "can-join" | "cannot-join") {
  if (status === "booked") {
    return {
      label: "Already booked",
      className: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    };
  }
  if (status === "can-join") {
    return {
      label: "Can join",
      className: "bg-green-500/20 text-green-700 dark:text-green-300",
    };
  }
  return {
    label: "Cannot join",
    className: "bg-muted text-muted-foreground",
  };
}

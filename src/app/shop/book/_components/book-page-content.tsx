"use client";

import { useMemo, useState } from "react";

import { addDays, format, startOfDay } from "date-fns";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberSessions, useSessionEligibilityBatch, type MemberSession } from "@/hooks/use-member-sessions";

import { SessionCard } from "../../_components/session-card";

import { BookingModal } from "./booking-modal";

const defaultStart = startOfDay(new Date());
const defaultEnd = addDays(defaultStart, 14);

interface ClassOption {
  id: string;
  name: string;
}

interface BookPageContentProps {
  classes: ClassOption[];
}

export function BookPageContent({ classes }: BookPageContentProps) {
  const [startDate, setStartDate] = useState(() => format(defaultStart, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => format(defaultEnd, "yyyy-MM-dd"));
  const [itemId, setItemId] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<MemberSession | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filters = useMemo(() => ({ startDate, endDate, itemId: itemId || undefined }), [startDate, endDate, itemId]);
  const { data: sessions = [], isLoading } = useMemberSessions(filters);
  const sessionIds = useMemo(() => sessions.map((s) => s.id), [sessions]);
  const { bySessionId } = useSessionEligibilityBatch(sessionIds, sessionIds.length > 0);

  const handleSelectSession = (s: MemberSession) => {
    setSelectedSession(s);
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <section className="mb-8">
        <h2 className="text-2xl font-bold">Book a class</h2>
        <p className="text-muted-foreground mt-1">Browse upcoming sessions and book based on your membership.</p>
      </section>

      <section className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-sm" htmlFor="start">
            From
          </Label>
          <input
            id="start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-sm" htmlFor="end">
            To
          </Label>
          <input
            id="end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border-input bg-background rounded-md border px-3 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-sm" htmlFor="class">
            Class
          </Label>
          <Select value={itemId || "all"} onValueChange={(v) => setItemId(v === "all" ? "" : v)}>
            <SelectTrigger id="class" className="w-[180px]">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center">
          <p>No sessions in this date range.</p>
          <p className="mt-1 text-sm">Try adjusting the date range above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              eligibility={bySessionId[session.id]}
              onCardClick={() => handleSelectSession(session)}
              actionLabel="View"
              onActionClick={() => handleSelectSession(session)}
              actionDisabled={false}
            />
          ))}
        </div>
      )}

      <BookingModal session={selectedSession} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

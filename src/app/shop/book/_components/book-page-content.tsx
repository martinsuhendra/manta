"use client";

import { useMemo, useState } from "react";

import { addDays, format, parseISO, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemberSessions, useSessionEligibilityBatch, type MemberSession } from "@/hooks/use-member-sessions";
import { cn } from "@/lib/utils";

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

  const startDateObj = startDate ? new Date(startDate + "T00:00:00") : undefined;
  const endDateObj = endDate ? new Date(endDate + "T00:00:00") : undefined;

  const sessionsByDate = useMemo(() => {
    const acc: Record<string, MemberSession[]> = {};
    for (const session of sessions) {
      const dateKey = session.date;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(session);
    }
    return acc;
  }, [sessions]);

  const sortedDates = useMemo(() => Object.keys(sessionsByDate).sort(), [sessionsByDate]);

  const getSessionsForDate = (d: string): MemberSession[] =>
    Object.hasOwn(sessionsByDate, d) ? sessionsByDate[d] : [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 sm:py-8">
      <section className="mb-6 sm:mb-8">
        <h2 className="text-xl font-bold sm:text-2xl">Book a class</h2>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Browse upcoming sessions and book based on your membership.
        </p>
      </section>

      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-sm" htmlFor="start">
            From
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="start"
                variant="ghost"
                className={cn(
                  "h-10 min-w-[140px] justify-start text-left font-normal sm:w-[180px]",
                  !startDate && "opacity-90",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-white" />
                {startDateObj ? format(startDateObj, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDateObj}
                onSelect={(date) => date && setStartDate(format(date, "yyyy-MM-dd"))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-sm" htmlFor="end">
            To
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="end"
                variant="ghost"
                className={cn(
                  "h-10 min-w-[140px] justify-start text-left font-normal sm:w-[180px]",
                  !endDate && "opacity-90",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-white" />
                {endDateObj ? format(endDateObj, "MMM d, yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDateObj}
                onSelect={(date) => date && setEndDate(format(date, "yyyy-MM-dd"))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-sm" htmlFor="class">
            Class
          </Label>
          <Select value={itemId || "all"} onValueChange={(v) => setItemId(v === "all" ? "" : v)}>
            <SelectTrigger id="class" className="w-full min-w-0 sm:w-[180px]">
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
        <div className="space-y-8">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
                <div className="bg-primary text-primary-foreground flex flex-col items-center justify-center rounded-lg px-3 py-1.5 shadow-md sm:rounded-xl sm:px-4 sm:py-2">
                  <span className="text-[10px] font-bold uppercase sm:text-xs">{format(parseISO(date), "MMM")}</span>
                  <span className="text-xl font-black sm:text-2xl">{format(parseISO(date), "dd")}</span>
                </div>
                <h3 className="text-foreground truncate text-base font-bold sm:text-xl">
                  {format(parseISO(date), "EEEE")}
                </h3>
                <div className="bg-border h-px flex-1" />
              </div>
              <div className="space-y-4">
                {getSessionsForDate(date).map((session) => (
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
            </div>
          ))}
        </div>
      )}

      <BookingModal session={selectedSession} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

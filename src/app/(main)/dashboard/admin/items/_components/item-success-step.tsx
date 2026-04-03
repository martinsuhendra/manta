"use client";

import * as React from "react";

import { Calendar, CheckCircle2, Clock, GraduationCap, Hash, MapPin, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { Item, DAY_OF_WEEK_LABELS } from "./schema";

interface ItemSuccessStepProps {
  item: Item;
  onClose: () => void;
}

interface ScheduleGroupRow {
  days: number[];
  startTime: string;
  endTime: string;
}

function buildScheduleGroups(schedules: Item["schedules"]): ScheduleGroupRow[] {
  if (!schedules?.length) return [];

  const bySlot = new Map<string, number[]>();
  for (const s of schedules) {
    const key = `${s.startTime}\u001f${s.endTime}`;
    const days = bySlot.get(key);
    if (days) days.push(s.dayOfWeek);
    else bySlot.set(key, [s.dayOfWeek]);
  }

  return Array.from(bySlot.entries()).map(([key, days]) => {
    const [startTime, endTime] = key.split("\u001f");
    return { days: [...days].sort((a, b) => a - b), startTime, endTime };
  });
}

function daysLabel(days: number[]) {
  if (days.length === 7) return "Everyday";
  return days
    .map((d) => DAY_OF_WEEK_LABELS.at(d))
    .filter((x): x is string => x != null && x !== "")
    .join(", ");
}

function ItemSuccessHero({ item }: { item: Item }) {
  const brands = item.itemBrands?.map((ib) => ib.brand) ?? [];

  return (
    <>
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-400/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl dark:bg-violet-400/12"
        aria-hidden
      />

      <div className="relative space-y-3 px-6 pt-6 pb-2">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-5 sm:text-left">
          <div className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-md dark:bg-emerald-400/25" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/90 to-teal-600/90 shadow-lg ring-2 ring-emerald-400/30 dark:ring-emerald-300/25">
              <CheckCircle2 className="h-8 w-8 text-white drop-shadow-sm" strokeWidth={2} />
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <div className="text-muted-foreground mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="secondary" className="gap-1 font-normal">
                <Sparkles className="h-3 w-3" />
                New class live
              </Badge>
              {brands.map((b) => (
                <Badge key={b.id} variant="outline" className="font-normal">
                  <MapPin className="mr-1 h-3 w-3" />
                  {b.name}
                </Badge>
              ))}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Class created</h2>
            <p className="text-muted-foreground text-base">
              Here’s what we saved. You can close when you’re ready—we’ll keep this class ready for scheduling and
              bookings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ItemSuccessSummaryPanel({ item, scheduleGroups }: { item: Item; scheduleGroups: ScheduleGroupRow[] }) {
  const scheduleCount = item.schedules?.length ?? 0;

  return (
    <div className="bg-card/80 border-border/60 dark:bg-card/60 space-y-5 rounded-2xl border p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-start gap-3">
        {item.color ? (
          <span
            className="mt-1 h-10 w-10 flex-shrink-0 rounded-xl border-2 shadow-sm"
            style={{ backgroundColor: item.color }}
          />
        ) : (
          <div className="bg-muted mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border">
            <GraduationCap className="text-muted-foreground h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-lg font-semibold">{item.name}</h3>
          {item.description ? (
            <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">{item.description}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/40 flex flex-col gap-0.5 rounded-xl border px-3 py-2.5">
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
            <Clock className="h-3 w-3" />
            Duration
          </span>
          <span className="text-foreground text-base font-semibold tabular-nums">
            {item.duration} <span className="text-muted-foreground text-sm font-normal">min</span>
          </span>
        </div>
        <div className="bg-muted/40 flex flex-col gap-0.5 rounded-xl border px-3 py-2.5">
          <span className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
            <Users className="h-3 w-3" />
            Capacity
          </span>
          <span className="text-foreground text-base font-semibold tabular-nums">
            {item.capacity} <span className="text-muted-foreground text-sm font-normal">people</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={
            item.isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200"
              : ""
          }
          variant={item.isActive ? "outline" : "secondary"}
        >
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
        <Badge variant="outline" className="gap-1 font-mono text-xs font-normal">
          <Hash className="h-3 w-3" />
          {item.id.slice(0, 8)}…
        </Badge>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Calendar className="h-3.5 w-3.5" />
          {scheduleCount} schedule slot{scheduleCount === 1 ? "" : "s"}
        </span>
      </div>

      <Separator />

      <div>
        <h4 className="text-foreground mb-3 flex items-center gap-2 text-sm font-semibold">
          Weekly availability
          {scheduleGroups.length > 0 ? (
            <Badge variant="secondary" className="h-5 px-1.5 tabular-nums">
              {scheduleGroups.length}
            </Badge>
          ) : null}
        </h4>
        {scheduleGroups.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed px-4 py-6 text-center text-sm">
            No recurring slots yet—you can edit this class anytime to add schedules.
          </p>
        ) : (
          <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {scheduleGroups.map((group) => (
              <li
                key={`${group.startTime}-${group.endTime}-${group.days.join(",")}`}
                className="bg-muted/30 rounded-xl border px-3 py-2.5 text-sm"
              >
                <p className="font-medium">{daysLabel(group.days)}</p>
                <p className="text-muted-foreground text-xs">
                  {group.startTime} – {group.endTime}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ItemSuccessPreviewCard({ item }: { item: Item }) {
  return (
    <div
      className="border-border/60 bg-card/90 flex flex-col overflow-hidden rounded-2xl border shadow-md backdrop-blur-sm"
      style={item.color ? { borderTopWidth: "4px", borderTopColor: item.color } : undefined}
    >
      {item.image ? (
        <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote / data URLs from upload */}
          <img src={item.image} alt="" className="h-full w-full object-cover" />
        </div>
      ) : (
        <div
          className="flex aspect-[16/10] w-full items-center justify-center"
          style={{ background: item.color ? `${item.color}18` : undefined }}
        >
          <GraduationCap className="text-muted-foreground h-12 w-12 opacity-40" />
        </div>
      )}
      <div className="space-y-2 p-4">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Preview</p>
        <p className="text-lg leading-tight font-semibold">{item.name}</p>
        <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {item.duration} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {item.capacity} capacity
          </span>
        </div>
      </div>
    </div>
  );
}

export function ItemSuccessStep({ item, onClose }: ItemSuccessStepProps) {
  const scheduleGroups = React.useMemo(() => buildScheduleGroups(item.schedules), [item.schedules]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="from-primary/[0.08] via-background dark:from-primary/[0.12] relative min-h-0 flex-1 overflow-hidden bg-gradient-to-br to-emerald-500/[0.06] dark:to-emerald-500/[0.08]">
        <ItemSuccessHero item={item} />

        <div className="relative max-h-[min(58vh,480px)] overflow-y-auto px-6 pb-4">
          <div className="grid gap-6 lg:grid-cols-[1fr,minmax(0,300px)]">
            <ItemSuccessSummaryPanel item={item} scheduleGroups={scheduleGroups} />
            <div className="lg:pt-1">
              <ItemSuccessPreviewCard item={item} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background/95 flex justify-end border-t px-6 py-4 backdrop-blur-sm">
        <Button onClick={onClose} className="min-w-[140px]" size="lg">
          Done
        </Button>
      </div>
    </div>
  );
}

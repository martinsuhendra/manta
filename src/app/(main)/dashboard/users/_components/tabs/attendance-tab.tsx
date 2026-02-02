"use client";

import * as React from "react";

import { format } from "date-fns";
import { CalendarCheck, Calendar, Clock, MapPin, UserCheck } from "lucide-react";

import { StatusBadge } from "@/components/ui/status-badge";

import { EmptyState } from "./empty-state";
import { SeeHistoryButton } from "./see-history-button";
import { getBookingStatusIcon, getBookingStatusVariant, getSessionStatusVariant } from "./utils";

interface Booking {
  id: string;
  status: string;
  createdAt: string;
  classSession: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    item: {
      id: string;
      name: string;
    };
  };
  membership: {
    id: string;
    product: {
      id: string;
      name: string;
    };
  };
}

interface AttendanceTabProps {
  bookings: Booking[];
  memberId: string;
}

const RECENT_LIMIT = 3;

export function AttendanceTab({ bookings, memberId }: AttendanceTabProps) {
  const recentBookings = React.useMemo(() => bookings.slice(0, RECENT_LIMIT), [bookings]);

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No Attendance Records"
        description="This member has no attendance history."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Attendance</h3>
        <StatusBadge variant="secondary">{bookings.length} total</StatusBadge>
      </div>

      <div className="space-y-3">
        {recentBookings.map((booking) => (
          <AttendanceCard key={booking.id} booking={booking} />
        ))}
      </div>

      <SeeHistoryButton href={`/dashboard/users/${memberId}/sessions`} show={bookings.length > RECENT_LIMIT} />
    </div>
  );
}

function AttendanceCard({ booking }: { booking: Booking }) {
  const isConfirmed = booking.status === "CONFIRMED" || booking.status === "COMPLETED";

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isConfirmed ? "bg-primary/5 border-primary/20" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="text-muted-foreground h-4 w-4" />
              <h5 className="font-semibold">{booking.classSession.item.name}</h5>
            </div>
            <StatusBadge variant={getBookingStatusVariant(booking.status)}>
              <span className="mr-1">{getBookingStatusIcon(booking.status)}</span>
              {booking.status}
            </StatusBadge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Date</p>
              <div className="flex items-center gap-1">
                <Calendar className="text-muted-foreground h-3 w-3" />
                <p className="font-medium">{format(new Date(booking.classSession.date), "MMM dd, yyyy")}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Time</p>
              <div className="flex items-center gap-1">
                <Clock className="text-muted-foreground h-3 w-3" />
                <p className="font-medium">
                  {booking.classSession.startTime} - {booking.classSession.endTime}
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Session Status</p>
              <StatusBadge variant={getSessionStatusVariant(booking.classSession.status)}>
                {booking.classSession.status}
              </StatusBadge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Membership</p>
              <div className="flex items-center gap-1">
                <UserCheck className="text-muted-foreground h-3 w-3" />
                <p className="font-medium">{booking.membership.product.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

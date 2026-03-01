interface BookingWithParticipantCount {
  participantCount?: number | null;
}

export function sumParticipantSlots(bookings: BookingWithParticipantCount[]): number {
  return bookings.reduce((sum, b) => sum + (b.participantCount ?? 1), 0);
}

interface SessionForMapping {
  id: string;
  itemId: string;
  teacherId: string | null;
  date: Date | string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  item: {
    id: string;
    name: string;
    duration: number;
    capacity: number;
    color: string | null;
  };
  teacher: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  bookings: BookingWithParticipantCount[];
}

export function mapSessionWithCapacity(session: SessionForMapping) {
  const totalParticipantSlots = sumParticipantSlots(session.bookings);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { bookings: _bookings, ...rest } = session;
  const dateStr = typeof session.date === "string" ? session.date : session.date.toISOString().split("T")[0];

  return {
    ...rest,
    date: dateStr,
    spotsLeft: Math.max(0, session.item.capacity - totalParticipantSlots),
    capacity: session.item.capacity,
  };
}

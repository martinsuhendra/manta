import type { Prisma } from "@prisma/client";

import { getCapacityBookingStatuses } from "@/lib/booking-status";
import { prisma } from "@/lib/generated/prisma";

type BookingSlotFilter = "quota-consuming" | "not-cancelled";

function bookingStatusWhere(filter: BookingSlotFilter): Pick<Prisma.BookingWhereInput, "status"> {
  if (filter === "quota-consuming") {
    return { status: { in: getCapacityBookingStatuses() } };
  }

  return { status: { not: "CANCELLED" } };
}

function getParticipantSum(row: { _sum: { participantCount: number | null } }) {
  // eslint-disable-next-line no-underscore-dangle -- Prisma groupBy aggregate field
  return row._sum.participantCount ?? 0;
}

export async function sumParticipantSlotsBySessionIds(
  sessionIds: string[],
  filter: BookingSlotFilter,
): Promise<Map<string, number>> {
  if (sessionIds.length === 0) return new Map();

  const rows = await prisma.booking.groupBy({
    by: ["classSessionId"],
    where: {
      classSessionId: { in: sessionIds },
      ...bookingStatusWhere(filter),
    },
    _sum: { participantCount: true },
  });

  return new Map(rows.map((row) => [row.classSessionId, getParticipantSum(row)]));
}

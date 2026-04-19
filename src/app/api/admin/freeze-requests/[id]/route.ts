import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import { editFreezeSchema } from "@/app/(main)/dashboard/admin/freeze-requests/_components/freeze-requests-schema";
import { authOptions } from "@/auth";
import { FREEZE_REQUEST_STATUS } from "@/lib/constants/freeze";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (![USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN, USER_ROLES.DEVELOPER].includes(session.user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const values = editFreezeSchema.parse(body);

    const current = await prisma.membershipFreezeRequest.findUnique({
      where: { id },
      select: {
        id: true,
        approvedById: true,
        status: true,
        membership: {
          select: {
            id: true,
            joinDate: true,
            expiredAt: true,
          },
        },
      },
    });

    if (!current) return NextResponse.json({ error: "Freeze request not found" }, { status: 404 });

    const membershipJoinDate = current.membership.joinDate;
    const nextMembershipExpiredAt = values.membershipExpiredAt
      ? new Date(values.membershipExpiredAt)
      : current.membership.expiredAt;
    const nextFreezeStartDate = values.freezeStartDate ? new Date(values.freezeStartDate) : null;
    const nextFreezeEndDate = values.freezeEndDate ? new Date(values.freezeEndDate) : null;

    if (nextMembershipExpiredAt <= membershipJoinDate) {
      return NextResponse.json({ error: "Membership end date must be after membership start date" }, { status: 400 });
    }

    if (
      nextFreezeStartDate &&
      (nextFreezeStartDate < membershipJoinDate || nextFreezeStartDate > nextMembershipExpiredAt)
    ) {
      return NextResponse.json({ error: "Freeze start date must be within membership period" }, { status: 400 });
    }

    if (nextFreezeEndDate && (nextFreezeEndDate < membershipJoinDate || nextFreezeEndDate > nextMembershipExpiredAt)) {
      return NextResponse.json({ error: "Freeze end date must be within membership period" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (values.membershipExpiredAt) {
        await tx.membership.update({
          where: { id: current.membership.id },
          data: { expiredAt: nextMembershipExpiredAt },
        });
      }

      return tx.membershipFreezeRequest.update({
        where: { id },
        data: {
          reason: values.reason,
          reasonDetails: values.reasonDetails?.trim() ? values.reasonDetails : null,
          status: values.status,
          freezeStartDate: nextFreezeStartDate,
          freezeEndDate: nextFreezeEndDate,
          approvedById:
            values.status === FREEZE_REQUEST_STATUS.APPROVED && !current.approvedById
              ? session.user.id
              : current.approvedById,
        },
        include: {
          membership: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phoneNo: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                  validDays: true,
                },
              },
            },
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Error updating freeze request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

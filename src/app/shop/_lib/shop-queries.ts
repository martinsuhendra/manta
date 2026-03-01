import { addDays } from "date-fns";

import { prisma } from "@/lib/generated/prisma";
import { mapSessionWithCapacity } from "@/lib/session-utils";
import { USER_ROLES } from "@/lib/types";

export async function getClasses() {
  try {
    const classes = await prisma.item.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        duration: true,
        capacity: true,
        color: true,
        image: true,
      },
    });
    return classes;
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return [];
  }
}

export async function getActiveProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      orderBy: { position: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        validDays: true,
        participantsPerPurchase: true,
        image: true,
        paymentUrl: true,
        whatIsIncluded: true,
        features: true,
        createdAt: true,
      },
    });
    return products.map((product) => ({
      ...product,
      price: Number(product.price),
      createdAt: product.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export async function getUpcomingSessions() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = addDays(today, 7);

    const sessions = await prisma.classSession.findMany({
      where: {
        date: {
          gte: today,
          lte: nextWeek,
        },
        status: "SCHEDULED",
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            duration: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { id: true, participantCount: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 10,
    });

    return sessions.map(mapSessionWithCapacity);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return [];
  }
}

export async function getInstructors() {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: USER_ROLES.TEACHER,
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        bio: true,
      },
      take: 4,
    });
    return users.map(({ bio, ...rest }) => ({ ...rest, description: bio }));
  } catch (error) {
    console.error("Failed to fetch instructors:", error);
    return [];
  }
}

export async function getShopPageData() {
  const [products, sessions, classes, instructors] = await Promise.all([
    getActiveProducts(),
    getUpcomingSessions(),
    getClasses(),
    getInstructors(),
  ]);
  return { products, sessions, classes, instructors };
}

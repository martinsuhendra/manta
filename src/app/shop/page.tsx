import { Metadata } from "next";

import { addDays } from "date-fns";

import { APP_CONFIG } from "@/config/app-config";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

import { AboutSection } from "./_components/about-section";
import { ClassesSection } from "./_components/classes-section";
import { FacilitiesSection } from "./_components/facilities-section";
import { InstructorsSection } from "./_components/instructors-section";
import { LandingHero } from "./_components/landing-hero";
import { MembershipPlans } from "./_components/membership-plans";
import { UpcomingSessions } from "./_components/upcoming-sessions";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Join Our Community`,
  description: "Experience world-class CrossFit training, expert coaching, and a supportive community.",
};

async function getClasses() {
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

async function getActiveProducts() {
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
        image: true,
        paymentUrl: true,
        whatIsIncluded: true,
        features: true,
        createdAt: true,
      },
    });
    // Convert Decimal to number and Date to string for client components
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

async function getUpcomingSessions() {
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
          select: { id: true },
        },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 10,
    });

    return sessions.map((session) => ({
      id: session.id,
      itemId: session.itemId,
      teacherId: session.teacherId,
      date: session.date.toISOString().split("T")[0],
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      notes: session.notes,
      item: session.item,
      teacher: session.teacher,
      spotsLeft: Math.max(0, session.item.capacity - session.bookings.length),
      capacity: session.item.capacity,
    }));
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return [];
  }
}

async function getInstructors() {
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

export default async function ShopPage() {
  const [products, sessions, classes, instructors] = await Promise.all([
    getActiveProducts(),
    getUpcomingSessions(),
    getClasses(),
    getInstructors(),
  ]);

  return (
    <>
      <LandingHero />
      <AboutSection />
      <ClassesSection classes={classes} />
      <UpcomingSessions sessions={sessions} />
      <FacilitiesSection />
      <InstructorsSection instructors={instructors} />
      <MembershipPlans products={products} />
    </>
  );
}

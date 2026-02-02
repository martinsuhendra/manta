import { Metadata } from "next";

import { addDays } from "date-fns";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";
import { prisma } from "@/lib/generated/prisma";
import { USER_ROLES } from "@/lib/types";

import { AboutSection } from "./_components/about-section";
import { FacilitiesSection } from "./_components/facilities-section";
import { InstructorsSection } from "./_components/instructors-section";
import { LandingHero } from "./_components/landing-hero";
import { MembershipPlans } from "./_components/membership-plans";
import { ShopHeaderWrapper } from "./_components/shop-header-wrapper";
import { UpcomingSessions } from "./_components/upcoming-sessions";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} - Join Our Community`,
  description: "Experience world-class CrossFit training, expert coaching, and a supportive community.",
};

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
            name: true,
            capacity: true,
            color: true,
          },
        },
        teacher: {
          select: {
            name: true,
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
      date: session.date.toISOString(),
      startTime: session.startTime,
      endTime: session.endTime,
      item: session.item,
      teacher: session.teacher,
      spotsLeft: Math.max(0, session.item.capacity - session.bookings.length),
    }));
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return [];
  }
}

async function getInstructors() {
  try {
    const instructors = await prisma.user.findMany({
      where: {
        role: USER_ROLES.TEACHER,
      },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
      },
      take: 4,
    });
    return instructors;
  } catch (error) {
    console.error("Failed to fetch instructors:", error);
    return [];
  }
}

export default async function ShopPage() {
  const [products, sessions, instructors, session] = await Promise.all([
    getActiveProducts(),
    getUpcomingSessions(),
    getInstructors(),
    auth(),
  ]);

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <ShopHeaderWrapper session={session} />

      <main>
        <LandingHero />
        <AboutSection />
        <UpcomingSessions sessions={sessions} />
        <FacilitiesSection />
        <InstructorsSection instructors={instructors} />
        <MembershipPlans products={products} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950 py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold">{APP_CONFIG.name}</h3>
              <p className="text-muted-foreground mt-2 text-sm">Forging elite fitness since 2024.</p>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">
                Terms
              </a>
              <a href="#" className="hover:text-white">
                Privacy
              </a>
              <a href="#" className="hover:text-white">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>{APP_CONFIG.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

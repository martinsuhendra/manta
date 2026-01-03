import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";
import { prisma } from "@/lib/generated/prisma";

import { MyAccountContent } from "./_components/my-account-content";

export const metadata: Metadata = {
  title: `My Account - ${APP_CONFIG.name}`,
  description: "View your account details, membership, and purchase history",
};

async function getAccountData() {
  try {
    const session = await auth();

    if (!session?.user.id) {
      redirect("/shop");
    }

    // Get user with memberships and transactions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNo: true,
        role: true,
        createdAt: true,
        memberships: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                validDays: true,
              },
            },
            transaction: {
              select: {
                id: true,
                status: true,
                amount: true,
                currency: true,
                paidAt: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        transactions: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      redirect("/shop");
    }

    // Format the response
    const activeMembership = user.memberships.find((m) => m.status === "ACTIVE" && new Date(m.expiredAt) > new Date());

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNo: user.phoneNo,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      activeMembership: activeMembership
        ? {
            id: activeMembership.id,
            status: activeMembership.status,
            joinDate: activeMembership.joinDate.toISOString(),
            expiredAt: activeMembership.expiredAt.toISOString(),
            product: {
              id: activeMembership.product.id,
              name: activeMembership.product.name,
              price: Number(activeMembership.product.price),
              validDays: activeMembership.product.validDays,
            },
            transaction: activeMembership.transaction
              ? {
                  id: activeMembership.transaction.id,
                  status: activeMembership.transaction.status,
                  amount: Number(activeMembership.transaction.amount),
                  currency: activeMembership.transaction.currency,
                  paidAt: activeMembership.transaction.paidAt?.toISOString() || null,
                  createdAt: activeMembership.transaction.createdAt.toISOString(),
                }
              : null,
          }
        : null,
      allMemberships: user.memberships.map((m) => ({
        id: m.id,
        status: m.status,
        joinDate: m.joinDate.toISOString(),
        expiredAt: m.expiredAt.toISOString(),
        product: {
          id: m.product.id,
          name: m.product.name,
          price: Number(m.product.price),
          validDays: m.product.validDays,
        },
        transaction: m.transaction
          ? {
              id: m.transaction.id,
              status: m.transaction.status,
              amount: Number(m.transaction.amount),
              currency: m.transaction.currency,
              paidAt: m.transaction.paidAt?.toISOString() || null,
              createdAt: m.transaction.createdAt.toISOString(),
            }
          : null,
      })),
      purchaseHistory: user.transactions.map((t) => ({
        id: t.id,
        status: t.status,
        amount: Number(t.amount),
        currency: t.currency,
        paymentMethod: t.paymentMethod,
        paymentProvider: t.paymentProvider,
        paidAt: t.paidAt?.toISOString() || null,
        createdAt: t.createdAt.toISOString(),
        product: {
          id: t.product.id,
          name: t.product.name,
          price: Number(t.product.price),
        },
      })),
    };
  } catch (error) {
    console.error("Failed to fetch account data:", error);
    redirect("/shop");
  }
}

export default async function MyAccountPage() {
  const accountData = await getAccountData();

  return <MyAccountContent accountData={accountData} />;
}

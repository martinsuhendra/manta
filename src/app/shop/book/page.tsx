import { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { APP_CONFIG } from "@/config/app-config";
import { USER_ROLES } from "@/lib/types";

import { getClasses } from "../_lib/shop-queries";

import { BookPageContent } from "./_components/book-page-content";

export const metadata: Metadata = {
  title: `Book a Class - ${APP_CONFIG.name}`,
  description: "Browse and book classes based on your membership",
};

export default async function BookPage() {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/shop");
  }

  if (session.user.role !== USER_ROLES.MEMBER) {
    redirect("/shop");
  }

  const classes = await getClasses();
  return <BookPageContent classes={classes} />;
}

import {
  Users,
  LayoutDashboard,
  ChartBar,
  Banknote,
  Package,
  UserCheck,
  Calendar,
  type LucideIcon,
} from "lucide-react";

import { USER_ROLES } from "@/lib/types";

export interface NavSubItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
}

export interface NavMainItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  subItems?: NavSubItem[];
  comingSoon?: boolean;
  newTab?: boolean;
  isNew?: boolean;
  requiredRoles?: string[];
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
  {
    id: 1,
    label: "Dashboards",
    items: [
      {
        title: "Home",
        url: "/dashboard/home",
        icon: LayoutDashboard,
      },
      {
        title: "CRM",
        url: "/dashboard/crm",
        icon: ChartBar,
      },
      {
        title: "Finance",
        url: "/dashboard/finance",
        icon: Banknote,
      },
    ],
  },
  {
    id: 2,
    label: "Pages",
    items: [
      {
        title: "Users & Membership",
        url: "/dashboard/members",
        icon: Users,
        comingSoon: false,
        requiredRoles: [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN],
      },
      {
        title: "Classes",
        url: "/dashboard/admin/items",
        icon: Calendar,
        comingSoon: false,
        requiredRoles: [USER_ROLES.SUPERADMIN],
      },
      {
        title: "Products",
        url: "/dashboard/products",
        icon: Package,
        comingSoon: false,
        requiredRoles: [USER_ROLES.SUPERADMIN],
      },
      {
        title: "Sessions",
        url: "/dashboard/admin/sessions",
        icon: Calendar,
        comingSoon: false,
        requiredRoles: [USER_ROLES.ADMIN, USER_ROLES.SUPERADMIN],
      },
    ],
  },
];

"use client";

import type { ReactNode } from "react";

import { AlertTriangle, TrendingDown, TrendingUp, Users, Wallet } from "lucide-react";

import { dashboardOverviewMock } from "@/app/(main)/dashboard/_shared/overview/overview.config";
import type { DashboardOverview } from "@/app/(main)/dashboard/_shared/overview/schema";
import { sectionCardsGradientGridClassName } from "@/app/(main)/dashboard/_shared/overview/section-cards";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn, formatPrice } from "@/lib/utils";

interface HomeSummaryCardsProps {
  data?: DashboardOverview;
}

const gridClassName = cn(
  sectionCardsGradientGridClassName,
  "grid grid-cols-1 gap-4 *:min-w-0 sm:grid-cols-2 lg:grid-cols-4",
);

const compactCardClassName = "@container/card gap-2 py-4";

function DeltaBadge({ value }: { value: number }) {
  const isPositive = value >= 0;
  return (
    <StatusBadge variant="outline" className="h-6 shrink-0 px-1.5 text-[11px]">
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}
      {value}%
    </StatusBadge>
  );
}

interface SummaryStatCardProps {
  label: string;
  hint: string;
  value: ReactNode;
  footer: string;
  icon?: ReactNode;
  delta?: number;
  valueClassName?: string;
}

function SummaryStatCard({ label, hint, value, footer, icon, delta, valueClassName }: SummaryStatCardProps) {
  return (
    <Card className={compactCardClassName}>
      <CardHeader className="gap-2 px-4 pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            <div className="min-w-0">
              <CardTitle className="text-sm leading-none font-medium">{label}</CardTitle>
              <CardDescription className="text-xs">{hint}</CardDescription>
            </div>
          </div>
          {delta !== undefined ? <DeltaBadge value={delta} /> : null}
        </div>
        <p
          className={cn("pt-1 text-lg leading-tight font-semibold tabular-nums @[200px]/card:text-xl", valueClassName)}
        >
          {value}
        </p>
      </CardHeader>
      <CardFooter className="text-muted-foreground px-4 pt-0 text-[11px] leading-tight">{footer}</CardFooter>
    </Card>
  );
}

function StatIcon({ children, className }: { children: ReactNode; className: string }) {
  return <div className={cn("shrink-0 rounded-md p-1.5", className)}>{children}</div>;
}

export function HomeSummaryCards({ data = dashboardOverviewMock }: HomeSummaryCardsProps) {
  const { kpi } = data;

  return (
    <div className={gridClassName}>
      <SummaryStatCard
        label="Revenue"
        hint="This month"
        value={formatPrice(kpi.revenue.value)}
        delta={kpi.revenue.deltaPercent}
        footer="See Finance for full breakdown"
        icon={
          <StatIcon className="bg-green-500/10">
            <Wallet className="size-4 text-green-500" />
          </StatIcon>
        }
      />

      <SummaryStatCard
        label="Active Members"
        hint="Current roster"
        value={kpi.activeMembers.value}
        delta={kpi.activeMembers.deltaPercent}
        footer={`+${kpi.activeMembers.newCount} new · ${kpi.activeMembers.churnedCount} churned`}
        icon={
          <StatIcon className="bg-blue-500/10">
            <Users className="size-4 text-blue-500" />
          </StatIcon>
        }
      />

      <SummaryStatCard
        label="Check-ins"
        hint="This week"
        value={kpi.checkIns.value}
        delta={kpi.checkIns.deltaPercent}
        footer="Studio attendance pulse"
      />

      <SummaryStatCard
        label="Action Needed"
        hint="Requires attention"
        value={kpi.actionNeeded.value}
        footer="Expiring, freezes & low fill"
        valueClassName="text-yellow-500"
        icon={
          <StatIcon className="bg-yellow-500/10">
            <AlertTriangle className="size-4 text-yellow-500" />
          </StatIcon>
        }
      />
    </div>
  );
}

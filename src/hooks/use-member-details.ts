"use client";

import { useQuery } from "@tanstack/react-query";

import type { MemberDetails } from "@/app/(main)/dashboard/users/_components/schema";

export type MemberDetailsSection = "memberships" | "transactions" | "bookings" | "classSessions";

export interface MemberDetailsBase extends Omit<MemberDetails, "memberships" | "transactions" | "bookings"> {
  memberships?: MemberDetails["memberships"];
  transactions?: MemberDetails["transactions"];
  bookings?: MemberDetails["bookings"];
  classSessions?: MemberDetails["classSessions"];
  scheduledSessionCount?: number;
}

async function fetchMemberDetails(memberId: string, include?: MemberDetailsSection) {
  const params = new URLSearchParams();
  if (include) params.set("include", include);

  const query = params.toString();
  const response = await fetch(`/api/users/${memberId}/details${query ? `?${query}` : ""}`);
  if (!response.ok) throw new Error("Failed to fetch member details");
  return response.json() as Promise<MemberDetailsBase>;
}

export function useMemberDetailsBase(memberId: string | undefined, enabled: boolean) {
  return useQuery<MemberDetailsBase>({
    queryKey: ["member-details", memberId],
    queryFn: () => {
      if (!memberId) throw new Error("Member ID is required");
      return fetchMemberDetails(memberId);
    },
    enabled: enabled && !!memberId,
  });
}

export function useMemberDetailsSection(memberId: string | undefined, section: MemberDetailsSection, enabled: boolean) {
  return useQuery<MemberDetailsBase>({
    queryKey: ["member-details", memberId, section],
    queryFn: () => {
      if (!memberId) throw new Error("Member ID is required");
      return fetchMemberDetails(memberId, section);
    },
    enabled: enabled && !!memberId,
  });
}

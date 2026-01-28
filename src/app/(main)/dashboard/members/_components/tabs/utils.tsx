"use client";

import * as React from "react";

import { CheckCircle2, XCircle, Clock, AlertCircle, CreditCard, CalendarCheck, ClockIcon } from "lucide-react";

export function getTransactionStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" | "warning" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "FAILED":
    case "CANCELLED":
      return "destructive";
    case "PENDING":
      return "warning";
    case "PROCESSING":
      return "secondary";
    case "REFUNDED":
      return "outline";
    default:
      return "secondary";
  }
}

export function getMembershipStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "EXPIRED":
      return "destructive";
    case "SUSPENDED":
      return "outline";
    case "PENDING":
      return "secondary";
    default:
      return "secondary";
  }
}

export function getBookingStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "default";
    case "CANCELLED":
    case "NO_SHOW":
      return "destructive";
    case "WAITLISTED":
      return "secondary";
    default:
      return "secondary";
  }
}

export function getSessionStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "CANCELLED":
      return "destructive";
    case "SCHEDULED":
      return "secondary";
    default:
      return "secondary";
  }
}

export function getTransactionStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "FAILED":
    case "CANCELLED":
      return <XCircle className="h-4 w-4" />;
    case "PENDING":
    case "PROCESSING":
      return <Clock className="h-4 w-4" />;
    case "REFUNDED":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <CreditCard className="h-4 w-4" />;
  }
}

export function getBookingStatusIcon(status: string) {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return <CheckCircle2 className="h-4 w-4" />;
    case "CANCELLED":
    case "NO_SHOW":
      return <XCircle className="h-4 w-4" />;
    case "WAITLISTED":
      return <ClockIcon className="h-4 w-4" />;
    default:
      return <CalendarCheck className="h-4 w-4" />;
  }
}

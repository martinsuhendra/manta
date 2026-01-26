"use client";

import * as React from "react";

import { Clock, Users, Plus, X, Edit2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Item } from "../../admin/items/_components/schema";

import { QuotaType } from "./schema";

interface ItemCardProps {
  item: Item;
  isSelected?: boolean;
  quotaType?: QuotaType;
  quotaValue?: number;
  quotaPoolName?: string;
  onAdd?: () => void;
  onRemove?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
  variant?: "available" | "selected";
  disabled?: boolean;
}

function getQuotaTypeBadge(quotaType?: QuotaType) {
  if (!quotaType) return null;

  const badges: Record<QuotaType, { label: string; className: string }> = {
    INDIVIDUAL: {
      label: "Individual",
      className:
        "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200 dark:from-blue-950 dark:to-blue-900 dark:text-blue-300 dark:border-blue-800",
    },
    SHARED: {
      label: "Shared",
      className:
        "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200 dark:from-purple-950 dark:to-purple-900 dark:text-purple-300 dark:border-purple-800",
    },
    FREE: {
      label: "Free",
      className:
        "bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200 dark:from-green-950 dark:to-green-900 dark:text-green-300 dark:border-green-800",
    },
  };

  const badge = badges[quotaType];
  return (
    <Badge variant="outline" className={`border px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
      {badge.label}
    </Badge>
  );
}

function getQuotaInfo(quotaType?: QuotaType, quotaValue?: number, quotaPoolName?: string) {
  if (!quotaType) return null;

  if (quotaType === "INDIVIDUAL" && quotaValue) {
    return (
      <span className="text-muted-foreground text-xs">
        <span className="text-foreground font-semibold">{quotaValue}</span> uses
      </span>
    );
  }

  if (quotaType === "SHARED" && quotaPoolName) {
    return (
      <span className="text-muted-foreground text-xs">
        Pool: <span className="text-foreground font-semibold">{quotaPoolName}</span>
      </span>
    );
  }

  if (quotaType === "FREE") {
    return <span className="text-muted-foreground text-xs font-semibold">Unlimited</span>;
  }

  return null;
}

export function ItemCard({
  item,
  isSelected = false,
  quotaType,
  quotaValue,
  quotaPoolName,
  onAdd,
  onRemove,
  onEdit,
  showActions = true,
  variant = "available",
  disabled = false,
}: ItemCardProps) {
  return (
    <Card
      className={`group hover:border-primary/20 relative overflow-hidden transition-all duration-200 hover:shadow-sm ${
        isSelected ? "ring-primary ring-1" : ""
      } ${variant === "selected" ? "from-primary/5 border-l bg-gradient-to-r to-transparent" : ""} ${
        disabled ? "opacity-60" : ""
      }`}
      style={
        variant === "selected" && item.color
          ? {
              borderLeftColor: item.color,
              borderLeftWidth: "3px",
            }
          : undefined
      }
    >
      <CardContent>
        <div className="flex items-start gap-2">
          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-foreground truncate text-sm leading-tight font-semibold">{item.name}</h4>
                  {variant === "selected" && quotaType && getQuotaTypeBadge(quotaType)}
                </div>
                {item.description && (
                  <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs leading-tight">{item.description}</p>
                )}
              </div>
            </div>

            {/* Meta Info & Quota Info */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {item.duration}min
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {item.capacity}
                </span>
              </div>
              {variant === "selected" && (
                <div className="flex items-center gap-1">
                  <div className="bg-muted-foreground/40 h-0.5 w-0.5 rounded-full" />
                  {getQuotaInfo(quotaType, quotaValue, quotaPoolName)}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div
              className={`flex-shrink-0 transition-opacity duration-200 ${
                variant === "available" ? "opacity-0 group-hover:opacity-100" : "opacity-100"
              }`}
            >
              {variant === "available" && !isSelected && onAdd && (
                <Button
                  size="sm"
                  onClick={onAdd}
                  disabled={disabled}
                  className="h-6 w-6 rounded-md p-0 shadow-sm transition-all duration-200 hover:shadow"
                  title="Add item"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              {variant === "selected" && (
                <div className="flex gap-0.5">
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onEdit}
                      disabled={disabled}
                      className="hover:border-primary/50 h-6 w-6 rounded-md border p-0 transition-all duration-200"
                      title="Edit quota settings"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                  {onRemove && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onRemove}
                      disabled={disabled}
                      className="text-destructive hover:bg-destructive/10 hover:border-destructive/50 h-6 w-6 rounded-md border p-0 transition-all duration-200"
                      title="Remove item"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

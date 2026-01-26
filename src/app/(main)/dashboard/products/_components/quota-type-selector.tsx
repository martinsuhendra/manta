"use client";

import * as React from "react";

import { CheckCircle2, Users, Infinity as InfinityIcon, Info } from "lucide-react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { QuotaType } from "./schema";

interface QuotaTypeSelectorProps {
  selectedType: QuotaType | null;
  onTypeChange: (type: QuotaType) => void;
}

const QUOTA_TYPE_INFO: Record<
  QuotaType,
  { icon: React.ReactNode; title: string; description: string; example: string }
> = {
  INDIVIDUAL: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Individual Quota",
    description: "Each membership gets a specific number of uses for this item",
    example: "e.g., 5 yoga classes per membership",
  },
  SHARED: {
    icon: <Users className="h-5 w-5" />,
    title: "Shared Quota Pool",
    description: "Multiple items share a common quota pool that members can use across different items",
    example: "e.g., 10 sessions across all group classes",
  },
  FREE: {
    icon: <InfinityIcon className="h-5 w-5" />,
    title: "Free Item",
    description: "Unlimited access, no quota tracking needed",
    example: "e.g., access to facilities or free classes",
  },
};

export function QuotaTypeSelector({ selectedType, onTypeChange }: QuotaTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Select Quota Type</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground h-4 w-4 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>
                Choose how quota will be allocated for items. You can add items with different quota types to the same
                product.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <RadioGroup
        value={selectedType || undefined}
        onValueChange={onTypeChange}
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {(Object.keys(QUOTA_TYPE_INFO) as QuotaType[]).map((type) => {
          const info = QUOTA_TYPE_INFO[type];
          const isSelected = selectedType === type;

          return (
            <div key={type} className="flex h-full">
              <RadioGroupItem value={type} id={type} className="peer sr-only" />
              <Label
                htmlFor={type}
                className={`hover:border-primary/50 flex h-full w-full cursor-pointer flex-col gap-3 rounded-lg border-2 p-4 transition-all ${
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex-shrink-0 rounded-full p-2 ${
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {info.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{info.title}</div>
                    <p className="text-muted-foreground mt-1 text-sm">{info.description}</p>
                    <p className="text-muted-foreground mt-2 text-xs italic">{info.example}</p>
                  </div>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}

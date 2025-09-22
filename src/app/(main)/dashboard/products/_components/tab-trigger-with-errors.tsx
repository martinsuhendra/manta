import { AlertTriangle } from "lucide-react";

import { TabsTrigger } from "@/components/ui/tabs";

interface TabTriggerWithErrorsProps {
  value: string;
  children: React.ReactNode;
  hasError: boolean;
}

export function TabTriggerWithErrors({ value, children, hasError }: TabTriggerWithErrorsProps) {
  return (
    <TabsTrigger value={value} className="relative">
      {children}
      {hasError && <AlertTriangle className="text-destructive ml-2 h-4 w-4" />}
    </TabsTrigger>
  );
}

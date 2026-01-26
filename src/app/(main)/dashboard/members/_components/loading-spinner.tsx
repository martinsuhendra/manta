import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
    </div>
  );
}

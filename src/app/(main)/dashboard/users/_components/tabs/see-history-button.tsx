import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SeeHistoryButtonProps {
  href: string;
  show: boolean;
}

export function SeeHistoryButton({ href, show }: SeeHistoryButtonProps) {
  if (!show) return null;

  return (
    <div className="pt-2">
      <Button variant="outline" className="w-full" asChild>
        <Link href={href}>
          See History
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

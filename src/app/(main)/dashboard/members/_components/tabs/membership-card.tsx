import { format } from "date-fns";
import { Package } from "lucide-react";

function ChipSVG() {
  return (
    <svg enableBackground="new 0 0 132 92" viewBox="0 0 132 92" xmlns="http://www.w3.org/2000/svg" className="w-12">
      <title>Chip</title>
      <rect x="0.5" y="0.5" width="131" height="91" rx="15" className="fill-accent stroke-accent" />
      <rect x="9.5" y="9.5" width="48" height="21" rx="10.5" className="fill-accent stroke-accent-foreground" />
      <rect x="9.5" y="61.5" width="48" height="21" rx="10.5" className="fill-accent stroke-accent-foreground" />
      <rect x="9.5" y="35.5" width="48" height="21" rx="10.5" className="fill-accent stroke-accent-foreground" />
      <rect x="74.5" y="9.5" width="48" height="21" rx="10.5" className="fill-accent stroke-accent-foreground" />
      <rect x="74.5" y="61.5" width="48" height="21" rx="10.5" className="fill-accent stroke-accent-foreground" />
      <rect x="74.5" y="35.5" width="48" height="21" rx="10.5" className="fill-accent stroke-accent-foreground" />
    </svg>
  );
}

interface MembershipCardProps {
  memberName: string | null;
  productName: string;
  expiredAt: string;
}

export function MembershipCard({ memberName, productName, expiredAt }: MembershipCardProps) {
  return (
    <div className="bg-primary relative aspect-8/5 w-full max-w-sm overflow-hidden rounded-xl p-8 perspective-distant">
      <div className="absolute top-4 left-4">
        <Package className="fill-primary-foreground text-primary-foreground size-6" />
      </div>
      <div className="absolute top-1/2 w-full -translate-y-1/2">
        <div className="flex flex-col gap-2 px-4">
          <span className="text-accent line-clamp-1 font-mono text-xl leading-none font-medium tracking-wide uppercase">
            {memberName || "Member"}
          </span>
          <span className="text-accent/80 line-clamp-1 font-mono text-xs leading-none font-medium tracking-wide uppercase">
            {productName}
          </span>
        </div>
      </div>
      <div className="absolute right-4 bottom-4">
        <ChipSVG />
      </div>
      <div className="absolute bottom-4 left-4">
        <div className="flex flex-col">
          <span className="text-accent/70 font-mono text-[9px] leading-none tracking-wide uppercase">VALID THRU</span>
          <span className="text-accent font-mono text-xs leading-none font-medium tracking-wide">
            {format(new Date(expiredAt), "MM/yy")}
          </span>
        </div>
      </div>
    </div>
  );
}

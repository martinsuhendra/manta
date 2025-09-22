import { Banknote, Clock } from "lucide-react";

import { formatPrice } from "@/lib/utils";

interface ProductData {
  price: number;
  validDays: number;
}

export function ProductCardStats({ data }: { data: ProductData }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Banknote className="text-muted-foreground h-4 w-4" />
        <span className="font-semibold">{formatPrice(data.price)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="text-muted-foreground h-4 w-4" />
        <span>{data.validDays} days</span>
      </div>
    </div>
  );
}

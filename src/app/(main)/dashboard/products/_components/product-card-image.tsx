import Image from "next/image";

import { Package } from "lucide-react";

interface ProductData {
  name: string;
  image?: string | null;
}

export function ProductCardImage({ data }: { data: ProductData }) {
  return (
    <div className="bg-muted relative mb-4 aspect-video overflow-hidden rounded-lg border">
      {data.image ? (
        <Image src={data.image} alt={data.name} fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Package className="text-muted-foreground h-12 w-12" />
        </div>
      )}
    </div>
  );
}

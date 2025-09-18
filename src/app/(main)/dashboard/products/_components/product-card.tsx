"use client";

import * as React from "react";

import Image from "next/image";

import { format } from "date-fns";
import {
  Banknote,
  Calendar,
  Clock,
  ExternalLink,
  MoreVertical,
  Package,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Product } from "./schema";

interface ProductData {
  name: string;
  description?: string | null;
  price: number;
  validDays: number;
  quota: number;
  image?: string | null;
  paymentUrl?: string | null;
  whatIsIncluded?: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { memberships: number };
}

function ProductCardHeader({
  data,
  isPreview,
  product,
  onViewProduct,
  onEditProduct,
  onDeleteProduct,
}: {
  data: ProductData;
  isPreview: boolean;
  product?: Product | null;
  onViewProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-relaxed font-semibold break-words">{data.name}</h3>
          {data.description && <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{data.description}</p>}
        </div>
        {!isPreview && product && (
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onViewProduct?.(product)}>View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEditProduct?.(product)}>Edit Product</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDeleteProduct?.(product)}>
                  Delete Product
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </CardHeader>
  );
}
function ProductCardImage({ data }: { data: ProductData }) {
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
function ProductCardStats({ data }: { data: ProductData }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Banknote className="text-muted-foreground h-4 w-4" />
        <span className="font-semibold">Rp {Number(data.price || 0).toLocaleString("id-ID")}</span>
      </div>
      <div className="flex items-center gap-2">
        <Users className="text-muted-foreground h-4 w-4" />
        <span className="font-semibold">{data.quota}</span>
      </div>
      <div className="flex items-center gap-2">
        <Clock className="text-muted-foreground h-4 w-4" />
        <span>{data.validDays} days</span>
      </div>
    </div>
  );
}
function ProductCardIncludes({
  data,
  isPreview,
  isExpanded,
  setIsExpanded,
}: {
  data: ProductData;
  isPreview: boolean;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}) {
  if (!data.whatIsIncluded) return null;

  const contentClasses =
    "text-muted-foreground prose prose-sm max-w-none text-sm [&_li]:ml-0 [&_ol]:ml-3 [&_ol]:list-decimal [&_ul]:ml-3 [&_ul]:list-disc";
  const content = <div className={contentClasses} dangerouslySetInnerHTML={{ __html: data.whatIsIncluded }} />;

  return (
    <div className="mt-4 border-t pt-4">
      {isPreview ? (
        <>
          <h4 className="mb-2 text-sm font-medium">What&apos;s Included?</h4>
          {content}
        </>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 h-auto justify-between p-0 text-sm font-medium hover:bg-transparent"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            What&apos;s Included?
            {isExpanded ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
          {isExpanded && content}
        </>
      )}
    </div>
  );
}
function ProductCardFeatures({ product }: { product?: Product | null }) {
  if (!product?.features || product.features.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1">
        {product.features.slice(0, 3).map((feature) => (
          <Badge key={feature} variant="outline" className="text-xs">
            {feature}
          </Badge>
        ))}
        {product.features.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{product.features.length - 3} more
          </Badge>
        )}
      </div>
    </div>
  );
}
function ProductCardFooter({ data, isPreview }: { data: ProductData; isPreview: boolean }) {
  return (
    <CardFooter className="flex items-center justify-between pt-0">
      <div className="text-muted-foreground flex items-center gap-1 text-xs">
        <Calendar className="h-3 w-3" />
        {isPreview ? "Today" : format(new Date(data.createdAt), "MMM dd, yyyy")}
      </div>
      <div className="flex items-center gap-2">
        {data.paymentUrl && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={isPreview}
            onClick={(e) => {
              e.preventDefault();
              if (!isPreview && data.paymentUrl) {
                window.open(data.paymentUrl, "_blank");
              }
            }}
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Payment
          </Button>
        )}
        <Badge variant={data.isActive ? "default" : "secondary"} className="shrink-0">
          {data.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    </CardFooter>
  );
}
interface ProductCardProps {
  product?: Product;
  name?: string;
  description?: string;
  price?: number;
  validDays?: number;
  quota?: number;
  image?: string;
  paymentUrl?: string;
  whatIsIncluded?: string;
  isActive?: boolean;
  isPreview?: boolean;
  onViewProduct?: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
}
const DEFAULT_PRODUCT_DATA: ProductData = {
  name: "Product Name",
  description: "",
  price: 0,
  validDays: 30,
  quota: 10,
  image: "",
  paymentUrl: "",
  whatIsIncluded: "",
  isActive: true,
  createdAt: new Date().toISOString(),
  _count: { memberships: 0 },
};
function createProductData(props: ProductCardProps): ProductData {
  if (props.product) return props.product;
  const overrides = Object.fromEntries(
    Object.entries(props).filter(
      ([key, value]) => key !== "product" && key !== "isPreview" && !key.startsWith("on") && value !== undefined,
    ),
  );
  return { ...DEFAULT_PRODUCT_DATA, ...overrides };
}
export function ProductCard(props: ProductCardProps) {
  const { product, isPreview = false, onViewProduct, onEditProduct, onDeleteProduct } = props;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const data = createProductData(props);

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <ProductCardHeader
        data={data}
        isPreview={isPreview}
        product={product}
        onViewProduct={onViewProduct}
        onEditProduct={onEditProduct}
        onDeleteProduct={onDeleteProduct}
      />
      <CardContent className="pb-3">
        <ProductCardImage data={data} />
        <ProductCardStats data={data} />
        <ProductCardIncludes data={data} isPreview={isPreview} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
        <ProductCardFeatures product={product} />
      </CardContent>
      <ProductCardFooter data={data} isPreview={isPreview} />
    </Card>
  );
}
export function ProductPreview({
  name,
  description,
  price,
  validDays,
  quota,
  image,
  paymentUrl,
  whatIsIncluded,
  isActive,
}: {
  name: string;
  description?: string;
  price: number;
  validDays: number;
  quota: number;
  image?: string;
  paymentUrl?: string;
  whatIsIncluded?: string;
  isActive: boolean;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Preview</h3>
      <ProductCard
        name={name}
        description={description}
        price={price}
        validDays={validDays}
        quota={quota}
        image={image}
        paymentUrl={paymentUrl}
        whatIsIncluded={whatIsIncluded}
        isActive={isActive}
        isPreview
      />
    </div>
  );
}

import * as React from "react";

import { Calendar, Clock, Banknote, ExternalLink, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

import { Product } from "./schema";

interface BasicInfoTabProps {
  product: Product;
}

export function BasicInfoTab({ product }: BasicInfoTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-muted-foreground text-sm font-medium">Name</label>
              <p className="mt-1">{product.name}</p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm font-medium">Price</label>
              <p className="mt-1 flex items-center gap-1">
                <Banknote className="h-4 w-4" />
                {formatPrice(product.price)}
              </p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm font-medium">Valid Days</label>
              <p className="mt-1 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {product.validDays} days
              </p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm font-medium">Status</label>
              <div className="mt-1">
                <Badge variant={product.isActive ? "default" : "secondary"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-sm font-medium">Created</label>
              <p className="mt-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(product.createdAt).toLocaleDateString()}
              </p>
            </div>
            {product.paymentUrl && (
              <div>
                <label className="text-muted-foreground text-sm font-medium">Payment URL</label>
                <p className="mt-1">
                  <a
                    href={product.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Payment Page
                  </a>
                </p>
              </div>
            )}
          </div>

          {product.description && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Description</label>
              <p className="mt-1 text-sm">{product.description}</p>
            </div>
          )}

          {product.whatIsIncluded && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">What&apos;s Included</label>
              <div className="mt-1 text-sm" dangerouslySetInnerHTML={{ __html: product.whatIsIncluded }} />
            </div>
          )}

          {product.features.length > 0 && (
            <div>
              <label className="text-muted-foreground text-sm font-medium">Features</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {product.features.map((feature) => (
                  <Badge key={feature} variant="outline">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

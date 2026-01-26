import { useState } from "react";

import { Search, Package } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Item } from "../../admin/items/_components/schema";

import { ItemCard } from "./item-card";

interface ItemSelectorProps {
  selectedItems: string[];
  onItemAdd: (item: Item) => void;
  availableItems: Item[];
  quotaType: string | null;
}

export function ItemSelector({ selectedItems, onItemAdd, availableItems, quotaType }: ItemSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = availableItems.filter(
    (item) =>
      !selectedItems.includes(item.id) &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Available Items
        </CardTitle>
        <CardDescription>
          {quotaType
            ? `Select items to add with ${quotaType === "INDIVIDUAL" ? "individual" : quotaType === "SHARED" ? "shared pool" : "free"} quota type`
            : "Select a quota type above to start adding items"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              disabled={!quotaType}
            />
          </div>

          <div className="h-[500px] overflow-y-auto">
            {!quotaType ? (
              <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-center">
                <div>
                  <p className="font-medium">Select a quota type to view available items</p>
                  <p className="mt-2 text-sm">
                    Choose how quota will be allocated before adding items to your product.
                  </p>
                </div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center py-12 text-center">
                <div>
                  <p className="font-medium">No items available</p>
                  <p className="mt-2 text-sm">
                    {searchQuery ? "Try a different search term" : "All items have been added or no items exist"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.includes(item.id)}
                    onAdd={() => onItemAdd(item)}
                    variant="available"
                    showActions={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

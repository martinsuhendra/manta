import { useState } from "react";

import { Plus, Search, Package, Clock, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Item } from "../../admin/items/_components/schema";

interface ItemSelectorProps {
  selectedItems: string[];
  onItemAdd: (item: Item) => void;
  availableItems: Item[];
}

export function ItemSelector({ selectedItems, onItemAdd, availableItems }: ItemSelectorProps) {
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
            />
          </div>

          <div className="h-[400px] overflow-y-auto">
            <div className="grid gap-3">
              {filteredItems.map((item) => (
                <Card key={item.id} className="w-full">
                  <CardContent className="hover:bg-muted/50 flex justify-between p-3 transition-colors">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {item.color && (
                        <div
                          className="h-4 w-4 flex-shrink-0 rounded-full border"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{item.name}</div>
                        {item.description && <p className="text-muted-foreground text-sm">{item.description}</p>}
                        <div className="text-muted-foreground mt-1 flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.duration}min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.capacity} people
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => onItemAdd(item)} className="flex-shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

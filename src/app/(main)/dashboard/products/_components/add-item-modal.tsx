/* eslint-disable max-lines */
"use client";

import * as React from "react";

import { CheckCircle2, Users, Infinity as InfinityIcon, ArrowLeft, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Item } from "../../admin/items/_components/schema";

import { ItemCard } from "./item-card";
import { QuotaType, CreateQuotaPoolForm, QuotaPool } from "./schema";

type ModalStep = "quota-type" | "create-pool" | "select-pool" | "select-item";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableItems: Item[];
  selectedItemIds: string[];
  quotaPools: QuotaPool[];
  onItemAdd: (item: Item, quotaType: QuotaType, quotaValue?: number, quotaPoolId?: string) => void;
  onPoolCreate?: (pool: CreateQuotaPoolForm) => void;
}

const QUOTA_TYPE_INFO: Record<QuotaType, { icon: React.ReactNode; title: string; description: string }> = {
  INDIVIDUAL: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "Individual Quota",
    description: "Each membership gets a specific number of uses for this item",
  },
  SHARED: {
    icon: <Users className="h-5 w-5" />,
    title: "Shared Quota Pool",
    description: "Multiple items share a common quota pool",
  },
  FREE: {
    icon: <InfinityIcon className="h-5 w-5" />,
    title: "Free Item",
    description: "Unlimited access, no quota tracking needed",
  },
};

export function AddItemModal({
  open,
  onOpenChange,
  availableItems,
  selectedItemIds,
  quotaPools,
  onItemAdd,
  onPoolCreate,
}: AddItemModalProps) {
  const [step, setStep] = React.useState<ModalStep>("quota-type");
  const [selectedQuotaType, setSelectedQuotaType] = React.useState<QuotaType | null>(null);
  const [selectedQuotaValue, setSelectedQuotaValue] = React.useState<string>("1");
  const [selectedQuotaPoolId, setSelectedQuotaPoolId] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState("");

  // New pool form state
  const [newPool, setNewPool] = React.useState<CreateQuotaPoolForm>({
    name: "",
    description: "",
    totalQuota: 10,
    isActive: true,
  });

  const filteredItems = availableItems.filter(
    (item) =>
      !selectedItemIds.includes(item.id) &&
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleQuotaTypeSelect = (type: QuotaType) => {
    setSelectedQuotaType(type);
    if (type === "SHARED") {
      if (quotaPools.length === 0) {
        setStep("create-pool");
      } else {
        setStep("select-pool");
      }
    } else {
      setStep("select-item");
    }
  };

  const handlePoolCreate = () => {
    if (newPool.name.trim() && onPoolCreate) {
      onPoolCreate(newPool);
      // Reset pool form
      setNewPool({
        name: "",
        description: "",
        totalQuota: 10,
        isActive: true,
      });
      // Move to select pool step - the newly created pool will be available
      setStep("select-pool");
    }
  };

  // Auto-select newly created pool if we just created one and pools list updated
  React.useEffect(() => {
    if (step === "select-pool" && quotaPools.length > 0 && !selectedQuotaPoolId) {
      // Select the most recently created pool (last in array)
      const latestPool = quotaPools[quotaPools.length - 1];
      setSelectedQuotaPoolId(latestPool.id);
    }
  }, [quotaPools, step, selectedQuotaPoolId]);

  const handleItemSelect = (item: Item) => {
    if (!selectedQuotaType) return;

    let quotaValue: number | undefined;
    let quotaPoolId: string | undefined;

    if (selectedQuotaType === "INDIVIDUAL") {
      quotaValue = parseInt(selectedQuotaValue) || 1;
    } else if (selectedQuotaType === "SHARED") {
      quotaPoolId = selectedQuotaPoolId || undefined;
    }

    onItemAdd(item, selectedQuotaType, quotaValue, quotaPoolId);
    handleClose();
  };

  const handleClose = () => {
    setStep("quota-type");
    setSelectedQuotaType(null);
    setSelectedQuotaValue("1");
    setSelectedQuotaPoolId("");
    setSearchQuery("");
    setNewPool({
      name: "",
      description: "",
      totalQuota: 10,
      isActive: true,
    });
    onOpenChange(false);
  };

  const handleBack = () => {
    if (step === "select-item") {
      if (selectedQuotaType === "SHARED") {
        if (quotaPools.length === 0) {
          setStep("create-pool");
        } else {
          setStep("select-pool");
        }
      } else {
        setStep("quota-type");
      }
    } else if (step === "select-pool") {
      setStep("quota-type");
    } else if (step === "create-pool") {
      setStep("quota-type");
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "quota-type":
        return "Select Quota Type";
      case "create-pool":
        return "Create Quota Pool";
      case "select-pool":
        return "Select Quota Pool";
      case "select-item":
        return "Select Item";
      default:
        return "Add Item";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "quota-type":
        return "Choose how quota will be allocated for this item";
      case "create-pool":
        return "Create a shared quota pool that multiple items can use";
      case "select-pool":
        return "Select which quota pool this item will use";
      case "select-item":
        return `Select an item to add with ${selectedQuotaType === "INDIVIDUAL" ? "individual" : selectedQuotaType === "SHARED" ? "shared pool" : "free"} quota`;
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {step !== "quota-type" && (
              <Button type="button" variant="ghost" size="icon" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <DialogTitle>{getStepTitle()}</DialogTitle>
              <DialogDescription>{getStepDescription()}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {step === "quota-type" && (
            <div className="space-y-4">
              <RadioGroup
                value={selectedQuotaType || undefined}
                onValueChange={(value) => handleQuotaTypeSelect(value as QuotaType)}
                className="grid grid-cols-1 gap-4"
              >
                {(Object.keys(QUOTA_TYPE_INFO) as QuotaType[]).map((type) => {
                  const info = QUOTA_TYPE_INFO[type];
                  const isSelected = selectedQuotaType === type;

                  return (
                    <div key={type} className="flex">
                      <RadioGroupItem value={type} id={type} className="peer sr-only" />
                      <Label
                        htmlFor={type}
                        className={`hover:border-primary/50 flex w-full cursor-pointer flex-col items-start gap-3 rounded-lg border-2 p-4 transition-all ${
                          isSelected ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex-shrink-0 rounded-full p-2 ${
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {info.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold">{info.title}</div>
                            <p className="text-muted-foreground mt-1 text-sm">{info.description}</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          )}

          {step === "create-pool" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="pool-name">Pool Name</Label>
                <Input
                  id="pool-name"
                  placeholder="e.g., Group Classes"
                  value={newPool.name}
                  onChange={(e) => setNewPool((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="pool-description">Description (optional)</Label>
                <Input
                  id="pool-description"
                  placeholder="e.g., Shared quota for all group classes"
                  value={newPool.description}
                  onChange={(e) => setNewPool((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="pool-quota">Total Quota</Label>
                <Input
                  id="pool-quota"
                  type="number"
                  min="1"
                  value={newPool.totalQuota}
                  onChange={(e) => setNewPool((prev) => ({ ...prev, totalQuota: parseInt(e.target.value) || 1 }))}
                  className="mt-2"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Total number of uses available across all items using this pool
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handlePoolCreate} disabled={!newPool.name.trim()}>
                  Create Pool & Continue
                </Button>
              </div>
            </div>
          )}

          {step === "select-pool" && (
            <div className="space-y-4">
              {quotaPools.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <p className="font-medium">No quota pools available</p>
                  <p className="mt-2 text-sm">Create a quota pool first to use shared quota</p>
                  <Button className="mt-4" onClick={() => setStep("create-pool")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Quota Pool
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <Label className="mb-2">Select Quota Pool</Label>
                    <Select value={selectedQuotaPoolId} onValueChange={setSelectedQuotaPoolId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a pool" />
                      </SelectTrigger>
                      <SelectContent>
                        {quotaPools.map((pool) => (
                          <SelectItem key={pool.id} value={pool.id}>
                            {pool.name} ({pool.totalQuota} quota)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setStep("select-item")} disabled={!selectedQuotaPoolId} className="flex-1">
                      Continue
                    </Button>
                    <Button variant="outline" onClick={() => setStep("create-pool")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Pool
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {step === "select-item" && (
            <div className="space-y-4">
              {selectedQuotaType === "INDIVIDUAL" && (
                <div>
                  <Label htmlFor="quota-value">Quota Value</Label>
                  <Input
                    id="quota-value"
                    type="number"
                    min="1"
                    value={selectedQuotaValue}
                    onChange={(e) => setSelectedQuotaValue(e.target.value)}
                    placeholder="Enter number of uses"
                    className="mt-2"
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    Number of times this item can be used per membership
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="search-items">Search Items</Label>
                <Input
                  id="search-items"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div className="max-h-[400px] space-y-3 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    <p className="font-medium">No items available</p>
                    <p className="mt-2 text-sm">
                      {searchQuery ? "Try a different search term" : "All items have been added"}
                    </p>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onAdd={() => handleItemSelect(item)}
                      variant="available"
                      showActions={true}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

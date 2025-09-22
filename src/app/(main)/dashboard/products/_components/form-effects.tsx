import { useEffect, useCallback } from "react";

import { UseFormReturn } from "react-hook-form";

import { FormData, DEFAULT_FORM_VALUES } from "./hooks/use-form-validation";
import { Product, CreateProductItemForm, QuotaPool, ProductItem } from "./schema";

interface UseFormEffectsParams {
  form: UseFormReturn<FormData>;
  isEdit: boolean;
  product?: Product | null;
  open: boolean;
  existingProductItems: ProductItem[];
  existingQuotaPools: QuotaPool[];
  setProductItems: (items: CreateProductItemForm[]) => void;
  setQuotaPools: (pools: QuotaPool[]) => void;
  setCurrentTab: (tab: string) => void;
  setHasAttemptedSubmit: (value: boolean) => void;
}

export function useFormEffects({
  form,
  isEdit,
  product,
  open,
  existingProductItems,
  existingQuotaPools,
  setProductItems,
  setQuotaPools,
  setCurrentTab,
  setHasAttemptedSubmit,
}: UseFormEffectsParams) {
  const resetFormState = useCallback(() => {
    setCurrentTab("basic");
    setHasAttemptedSubmit(false);
    if (!isEdit) {
      setProductItems([]);
      setQuotaPools([]);
    }
  }, [isEdit, setCurrentTab, setHasAttemptedSubmit, setProductItems, setQuotaPools]);

  useEffect(() => {
    if (isEdit && product) {
      form.reset({
        name: product.name,
        description: product.description || "",
        price: product.price,
        validDays: product.validDays,
        features: product.features,
        image: product.image || "",
        paymentUrl: product.paymentUrl || "",
        whatIsIncluded: product.whatIsIncluded || "",
        isActive: product.isActive,
      });
    } else if (!isEdit) {
      form.reset(DEFAULT_FORM_VALUES);
    }
    if (open) {
      resetFormState();
    }
  }, [product, form, isEdit, open, resetFormState]);

  useEffect(() => {
    if (isEdit && existingProductItems.length > 0) {
      const convertedItems: CreateProductItemForm[] = existingProductItems.map((item: ProductItem) => ({
        itemId: item.itemId,
        quotaType: item.quotaType,
        quotaValue: item.quotaValue || undefined,
        quotaPoolId: item.quotaPoolId || undefined,
        isActive: item.isActive,
        order: item.order,
      }));
      setProductItems(convertedItems);
    }
  }, [isEdit, existingProductItems, setProductItems]);

  useEffect(() => {
    if (isEdit && existingQuotaPools.length > 0) {
      setQuotaPools(existingQuotaPools);
    }
  }, [isEdit, existingQuotaPools, setQuotaPools]);
}

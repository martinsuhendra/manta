import { toast } from "sonner";

import { FormData } from "../hooks/use-form-validation";
import { Product, QuotaPool, CreateProductItemForm } from "../schema";

interface SubmissionParams {
  data: FormData;
  isEdit: boolean;
  product?: Product | null;
  productItems: CreateProductItemForm[];
  quotaPools: QuotaPool[];
  createProduct: {
    mutateAsync: (data: FormData) => Promise<Product>;
  };
  updateProduct: {
    mutateAsync: (params: { id: string; data: FormData }) => Promise<Product>;
  };
  onOpenChange: (open: boolean) => void;
  resetForm: () => void;
  showSuccessStep?: boolean; // If true, don't close dialog, let parent handle success
}

export async function handleProductSubmission({
  data,
  isEdit,
  product,
  productItems,
  quotaPools,
  createProduct,
  updateProduct,
  onOpenChange,
  resetForm,
  showSuccessStep = false,
}: SubmissionParams) {
  try {
    if (isEdit && product) {
      await updateProduct.mutateAsync({ id: product.id, data });
      toast.success("Product updated successfully");
    } else {
      const createdProduct = await createProduct.mutateAsync(data);
      await createQuotaPoolsAndItems(createdProduct, quotaPools, productItems);
      toast.success("Product created successfully");
    }

    // Only close dialog if not showing success step
    if (!showSuccessStep) {
      onOpenChange(false);
      if (!isEdit) {
        resetForm();
      }
    } else {
      // Reset form but keep dialog open for success step
      if (!isEdit) {
        resetForm();
      }
    }
  } catch (error) {
    console.error(`Failed to ${isEdit ? "update" : "create"} product:`, error);
    const errorMessage = error instanceof Error ? error.message : `Failed to ${isEdit ? "update" : "create"} product`;
    toast.error(errorMessage);
    throw error; // Re-throw so caller knows submission failed
  }
}

async function createQuotaPoolsAndItems(
  createdProduct: Product,
  quotaPools: QuotaPool[],
  productItems: CreateProductItemForm[],
) {
  const quotaPoolIdMap = new Map<string, string>();

  if (quotaPools.length > 0) {
    for (const pool of quotaPools) {
      const { id: tempId, ...poolData } = pool;
      const cleanPoolData = {
        name: poolData.name,
        description: poolData.description || undefined,
        totalQuota: poolData.totalQuota,
        isActive: poolData.isActive,
      };

      const response = await fetch(`/api/admin/products/${createdProduct.id}/quota-pools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanPoolData),
      });

      if (response.ok) {
        const createdPool = await response.json();
        quotaPoolIdMap.set(tempId, createdPool.id);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to create quota pool: ${response.status} ${errorText}`);
      }
    }
  }

  if (productItems.length > 0) {
    const itemsWithRealPoolIds = productItems.map((item) => {
      if (item.quotaPoolId && quotaPoolIdMap.has(item.quotaPoolId)) {
        return { ...item, quotaPoolId: quotaPoolIdMap.get(item.quotaPoolId) };
      }
      return item;
    });

    const response = await fetch(`/api/admin/products/${createdProduct.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemsWithRealPoolIds),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create product items: ${response.status} ${errorText}`);
    }
  }
}

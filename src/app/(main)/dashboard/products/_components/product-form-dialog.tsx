"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products-mutation";

import { ProductPreview } from "./product-card";
import { ProductFormFields } from "./product-form-fields";
import { Product } from "./schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  validDays: z.coerce.number().positive("Valid days must be positive"),
  features: z.array(z.string()).default([]),
  image: z.string().optional(),
  paymentUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  whatIsIncluded: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

const DEFAULT_FORM_VALUES: FormData = {
  name: "",
  description: "",
  price: 0,
  validDays: 30,
  features: [],
  image: "",
  paymentUrl: "",
  whatIsIncluded: "",
  isActive: true,
};

interface ProductFormDialogProps {
  mode: "add" | "edit";
  product?: Product | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

function useDialogState(props: Pick<ProductFormDialogProps, "open" | "onOpenChange">) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = props.open ?? internalOpen;
  const onOpenChange = props.onOpenChange ?? setInternalOpen;
  return { open, onOpenChange };
}

function useProductMutation(mode: "add" | "edit") {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = mode === "edit";
  const mutation = isEdit ? updateProduct : createProduct;
  return { isEdit, mutation, createProduct, updateProduct };
}

function useSubmitHandler({
  isEdit,
  product,
  createProduct,
  updateProduct,
  onOpenChange,
  form,
}: {
  isEdit: boolean;
  product: Product | null;
  createProduct: { mutateAsync: (data: FormData) => Promise<unknown> };
  updateProduct: { mutateAsync: (params: { id: string; data: Partial<FormData> }) => Promise<unknown> };
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<FormData>;
}) {
  return React.useCallback(
    async (data: FormData) => {
      try {
        if (isEdit && product) {
          await updateProduct.mutateAsync({ id: product.id, data });
        } else {
          await createProduct.mutateAsync(data);
        }
        onOpenChange(false);
        if (!isEdit) {
          form.reset();
        }
      } catch (error) {
        console.error(`Failed to ${isEdit ? "update" : "create"} product:`, error);
      }
    },
    [isEdit, product, createProduct, updateProduct, onOpenChange, form],
  );
}

export function ProductFormDialog({
  mode,
  product = null,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: ProductFormDialogProps) {
  const { open, onOpenChange } = useDialogState({ open: controlledOpen, onOpenChange: controlledOnOpenChange });
  const { isEdit, mutation, createProduct, updateProduct } = useProductMutation(mode);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const onSubmit = useSubmitHandler({
    isEdit,
    product,
    createProduct,
    updateProduct,
    onOpenChange,
    form,
  });

  React.useEffect(() => {
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
  }, [product, form, isEdit, open]);

  const dialogContent = (
    <DialogContent className="flex h-[95vh] max-h-[95vh] w-[95vw] max-w-6xl flex-col">
      <DialogHeader className="flex-shrink-0">
        <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Update the product details." : "Create a new product for users to purchase."}
        </DialogDescription>
      </DialogHeader>
      <div className="flex-shrink-0 border-t" />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-2">
        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            <ProductFormFields
              form={form}
              mutation={mutation}
              isEdit={isEdit}
              onSubmit={onSubmit}
              onCancel={() => onOpenChange(false)}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden">
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            <ProductPreview
              name={form.watch("name")}
              description={form.watch("description")}
              price={form.watch("price") || 0}
              validDays={form.watch("validDays") || 30}
              image={form.watch("image")}
              paymentUrl={form.watch("paymentUrl")}
              whatIsIncluded={form.watch("whatIsIncluded")}
              isActive={form.watch("isActive")}
            />
          </div>
        </div>
      </div>
    </DialogContent>
  );

  // If no trigger provided (for edit mode), return just the dialog content
  if (!trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {dialogContent}
      </Dialog>
    );
  }

  // For add mode with trigger
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {dialogContent}
    </Dialog>
  );
}

// Convenience wrapper for Add Product
export function AddProductDialog() {
  return (
    <ProductFormDialog
      mode="add"
      trigger={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      }
    />
  );
}

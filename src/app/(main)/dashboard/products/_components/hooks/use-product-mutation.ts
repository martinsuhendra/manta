import { useCreateProduct, useUpdateProduct } from "@/hooks/use-products-mutation";

export function useProductMutation(mode: "add" | "edit") {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const isEdit = mode === "edit";
  const mutation = isEdit ? updateProduct : createProduct;
  return { isEdit, mutation, createProduct, updateProduct };
}

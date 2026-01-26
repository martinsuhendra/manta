import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const formSchema = z.object({
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

export type FormData = z.infer<typeof formSchema>;

export const DEFAULT_FORM_VALUES: FormData = {
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

export function useFormValidation(form: UseFormReturn<FormData>) {
  const hasBasicErrors = () => {
    const errors = form.formState.errors;
    return !!(errors.name || errors.price || errors.validDays);
  };

  return { hasBasicErrors };
}

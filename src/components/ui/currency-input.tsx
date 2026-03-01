import * as React from "react";

import { Input } from "./input";

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: number | string;
  onChange?: (value: number) => void;
  locale?: string;
  allowNegative?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, locale = "id-ID", allowNegative = false, ...props }, ref) => {
    const formatNumber = (num: number): string => {
      if (Number.isNaN(num) || num === undefined || num === null) return "";
      return num.toLocaleString(locale);
    };

    const parseNumber = (str: string): number => {
      // Remove all non-numeric characters except minus sign
      const cleaned = str.replace(/[^\d-]/g, "");

      // If negative numbers not allowed, remove minus sign
      if (!allowNegative) {
        return parseFloat(cleaned.replace(/-/g, "")) || 0;
      }

      return parseFloat(cleaned) || 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numValue = parseNumber(inputValue);

      onChange?.(numValue);
    };

    // Coerce to number so we always call toLocaleString on a number (form may pass string)
    const isEmpty = value === undefined || value === null || value === "";
    const numericValue = !isEmpty ? Number(value) : Number.NaN;
    const displayValue = Number.isNaN(numericValue) ? "" : formatNumber(numericValue);

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };


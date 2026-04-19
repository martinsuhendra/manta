"use client"

import * as React from "react"

import { format, startOfDay } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface BirthdayPickerProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  /** Show clear when a value is set (optional birthday fields) */
  allowClear?: boolean
  className?: string
}

export const BirthdayPicker = React.forwardRef<HTMLDivElement, BirthdayPickerProps>(function BirthdayPicker(
  { value, onChange, onBlur, placeholder = "Pick a date", disabled, allowClear, className },
  ref,
) {
  const selected = React.useMemo(() => {
    const v = value?.trim()
    if (!v) return undefined
    const d = new Date(`${v}T12:00:00`)
    return Number.isNaN(d.getTime()) ? undefined : d
  }, [value])

  const today = startOfDay(new Date())

  function handleSelect(date: Date | undefined) {
    if (!date) {
      onChange("")
      return
    }
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    onChange(`${y}-${m}-${day}`)
  }

  return (
    <div ref={ref} className={cn("flex flex-wrap items-center gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onBlur={onBlur}
            className={cn("min-w-0 flex-1 justify-start text-left font-normal", !selected && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">{selected ? format(selected, "MMMM d, yyyy") : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={(date) => startOfDay(date) > today}
            captionLayout="dropdown"
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {allowClear && value ? (
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground shrink-0" onClick={() => onChange("")}>
          Clear
        </Button>
      ) : null}
    </div>
  )
})

BirthdayPicker.displayName = "BirthdayPicker"

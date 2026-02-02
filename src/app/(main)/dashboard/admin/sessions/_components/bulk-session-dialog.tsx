"use client";

import * as React from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { CalendarIcon, Clock, Loader2, Plus, Save, Search, Star, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useItems } from "@/hooks/use-items-query";
import { useTeachers } from "@/hooks/use-users-query";
import { cn } from "@/lib/utils";

import { convertTemplateSessionsToDates } from "./bulk-session-dialog-helpers";
import { TIME_SLOTS } from "./schema";

const bulkSessionSchema = z.object({
  mode: z.enum(["AUTOMATIC", "MANUAL"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  itemIds: z.array(z.string()).min(1, "At least one class must be selected"),
  manualSessions: z
    .array(
      z.object({
        itemId: z.string(),
        teacherId: z.string().optional(),
        date: z.string(),
        startTime: z.string(),
        notes: z.string().optional(),
      }),
    )
    .optional(),
});

type BulkSessionForm = z.infer<typeof bulkSessionSchema>;

interface BulkSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface SessionTemplate {
  id: string;
  name: string;
  mode: "AUTOMATIC" | "MANUAL";
  itemIds: string[];
  manualSessions?: Array<{
    itemId: string;
    teacherId?: string;
    dayOfWeek: number;
    startTime: string;
    notes?: string;
  }>;
  createdAt: string;
}

export function BulkSessionDialog({ open, onOpenChange, onSuccess }: BulkSessionDialogProps) {
  const { data: items = [], isLoading: itemsLoading } = useItems({ includeSchedules: true });
  const { data: teachers = [] } = useTeachers();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [templates, setTemplates] = React.useState<SessionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>("");
  const [templateName, setTemplateName] = React.useState("");
  const [classSearchQuery, setClassSearchQuery] = React.useState("");

  const form = useForm<BulkSessionForm>({
    resolver: zodResolver(bulkSessionSchema),
    defaultValues: {
      mode: "AUTOMATIC",
      startDate: "",
      endDate: "",
      itemIds: [],
      manualSessions: [],
    },
  });

  const mode = form.watch("mode");
  const selectedItemIds = form.watch("itemIds");
  const manualSessions = form.watch("manualSessions") || [];

  // Load templates on mount
  React.useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const response = await axios.get("/api/admin/sessions/templates");
      setTemplates(response.data);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    form.setValue("mode", template.mode);
    form.setValue("itemIds", template.itemIds);

    const startDate = form.getValues("startDate");
    const endDate = form.getValues("endDate");
    const convertedSessions = convertTemplateSessionsToDates({ template, startDate, endDate });
    form.setValue("manualSessions", convertedSessions);
    setSelectedTemplate(templateId);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const formData = form.getValues();
    const templateData: Omit<SessionTemplate, "id" | "createdAt"> = {
      name: templateName,
      mode: formData.mode,
      itemIds: formData.itemIds,
    };

    if (formData.mode === "MANUAL" && formData.manualSessions) {
      // Convert dates to dayOfWeek for template storage
      templateData.manualSessions = formData.manualSessions.map((session) => {
        const date = new Date(session.date);
        return {
          itemId: session.itemId,
          teacherId: session.teacherId,
          dayOfWeek: date.getDay(),
          startTime: session.startTime,
          notes: session.notes,
        };
      });
    }

    try {
      await axios.post("/api/admin/sessions/templates", templateData);
      toast.success("Template saved successfully");
      setTemplateName("");
      loadTemplates();
    } catch (error) {
      toast.error("Failed to save template");
      console.error(error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await axios.delete(`/api/admin/sessions/templates?id=${templateId}`);
      toast.success("Template deleted successfully");
      loadTemplates();
      if (selectedTemplate === templateId) {
        setSelectedTemplate("");
      }
    } catch (error) {
      toast.error("Failed to delete template");
      console.error(error);
    }
  };

  const addManualSession = () => {
    const currentSessions = form.getValues("manualSessions") || [];
    form.setValue("manualSessions", [
      ...currentSessions,
      {
        itemId: selectedItemIds[0] || "",
        date: form.getValues("startDate") || "",
        startTime: "09:00",
        notes: "",
      },
    ]);
  };

  const removeManualSession = (index: number) => {
    const currentSessions = form.getValues("manualSessions") || [];
    form.setValue(
      "manualSessions",
      currentSessions.filter((_, i) => i !== index),
    );
  };

  const updateManualSession = (
    index: number,
    field: keyof { itemId: string; teacherId?: string; date: string; startTime: string; notes?: string },
    value: unknown,
  ) => {
    const currentSessions = form.getValues("manualSessions") || [];
    const updated = [...currentSessions];
    const sessionToUpdate = updated[index];
    if (sessionToUpdate) {
      updated[index] = { ...sessionToUpdate, [field]: value };
      form.setValue("manualSessions", updated);
    }
  };

  const onSubmit = async (data: BulkSessionForm) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/admin/sessions/bulk", data);
      toast.success(`Successfully created ${response.data.created} sessions`);
      form.reset();
      onSuccess?.();
      onOpenChange(false);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to create sessions");
      } else {
        toast.error("Failed to create sessions");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedTemplate("");
    setTemplateName("");
    setClassSearchQuery("");
    onOpenChange(false);
  };

  const hasTemplateSelected = !!selectedTemplate;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Create Bulk Sessions</DialogTitle>
          <DialogDescription>
            Create multiple sessions at once. Choose automatic generation from schedules or add custom sessions
            manually.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-6 overflow-y-auto pr-1">
              {/* Template Selection */}
              {templates.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Load from Template</Label>
                    {hasTemplateSelected && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate("");
                          form.reset();
                        }}
                      >
                        Clear Template
                      </Button>
                    )}
                  </div>
                  {!hasTemplateSelected ? (
                    <Select value={selectedTemplate} onValueChange={handleLoadTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex w-full items-center justify-between">
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-muted-foreground text-xs">
                                  {template.mode === "AUTOMATIC" ? "Automatic" : "Manual"} • {template.itemIds.length}{" "}
                                  class{template.itemIds.length !== 1 ? "es" : ""}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="bg-muted/50 rounded-md border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-1 items-center gap-2">
                          <Star className="text-primary h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium">{templates.find((t) => t.id === selectedTemplate)?.name}</div>
                            <div className="text-muted-foreground text-xs">
                              {form.getValues("mode") === "AUTOMATIC" ? "Automatic" : "Manual"} mode •{" "}
                              {form.getValues("itemIds").length} class
                              {form.getValues("itemIds").length !== 1 ? "es" : ""} selected
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleDeleteTemplate(selectedTemplate)}
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value + "T00:00:00"), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, "0");
                                const day = String(date.getDate()).padStart(2, "0");
                                field.onChange(`${year}-${month}-${day}`);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value + "T00:00:00"), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, "0");
                                const day = String(date.getDate()).padStart(2, "0");
                                field.onChange(`${year}-${month}-${day}`);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Class Selection */}
              {!hasTemplateSelected && (
                <FormField
                  control={form.control}
                  name="itemIds"
                  render={() => {
                    const filteredItems = items.filter(
                      (item) =>
                        item.name.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
                        item.description?.toLowerCase().includes(classSearchQuery.toLowerCase()),
                    );

                    return (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Select Classes</FormLabel>
                          <FormDescription>Choose which classes to create sessions for</FormDescription>
                        </div>
                        {itemsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative">
                              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                              <Input
                                placeholder="Search classes..."
                                value={classSearchQuery}
                                onChange={(e) => setClassSearchQuery(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-4">
                              {filteredItems.length === 0 ? (
                                <div className="text-muted-foreground py-8 text-center text-sm">
                                  No classes found matching &quot;{classSearchQuery}&quot;
                                </div>
                              ) : (
                                filteredItems.map((item) => (
                                  <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="itemIds"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={item.id}
                                          className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-3"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(item.id)}
                                              onCheckedChange={(checked) => {
                                                const currentValue = field.value || [];
                                                return checked
                                                  ? field.onChange([...currentValue, item.id])
                                                  : field.onChange(currentValue.filter((value) => value !== item.id));
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="flex-1 cursor-pointer space-y-1">
                                            <div className="flex flex-col gap-0.5">
                                              <h5 className="font-medium">{item.name}</h5>
                                              <p className="text-muted-foreground mt-1 text-sm">{item.duration} min</p>
                                              {item.schedules && item.schedules.length > 0 ? (
                                                <p className="text-muted-foreground text-xs">
                                                  {item.schedules.length} schedule(s) configured
                                                </p>
                                              ) : (
                                                <p className="text-muted-foreground text-xs">—</p>
                                              )}
                                            </div>
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))
                              )}
                            </div>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              {/* Mode Selection */}
              {!hasTemplateSelected && (
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Creation Mode</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(value as "AUTOMATIC" | "MANUAL")}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2 rounded-md border p-4">
                            <RadioGroupItem value="AUTOMATIC" id="automatic" />
                            <Label htmlFor="automatic" className="flex-1 cursor-pointer">
                              <div className="font-medium">Automatic</div>
                              <div className="text-muted-foreground ml-2 text-sm">
                                Sessions will be generated automatically based on each class&apos;s schedule
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 rounded-md border p-4">
                            <RadioGroupItem value="MANUAL" id="manual" />
                            <Label htmlFor="manual" className="flex-1 cursor-pointer">
                              <div className="font-medium">Manual</div>
                              <div className="text-muted-foreground ml-2 text-sm">
                                Add custom sessions with specific dates and times
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Manual Sessions */}
              {mode === "MANUAL" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Custom Sessions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addManualSession}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Session
                    </Button>
                  </div>

                  {manualSessions.length === 0 ? (
                    <div className="text-muted-foreground rounded-md border border-dashed p-8 text-center">
                      <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>No sessions added yet. Click &quot;Add Session&quot; to create custom sessions.</p>
                    </div>
                  ) : (
                    <div className="max-h-96 space-y-3 overflow-y-auto">
                      {manualSessions.map((session, index) => {
                        const sessionId = `manual-${index}-${session.itemId}-${session.date}-${session.startTime}`;
                        return (
                          <div key={sessionId} className="space-y-3 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">Session {index + 1}</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeManualSession(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Class</Label>
                                <Select
                                  value={session.itemId}
                                  onValueChange={(value) => updateManualSession(index, "itemId", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {items.map((item) => (
                                      <SelectItem key={item.id} value={item.id}>
                                        {item.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Teacher (Optional)</Label>
                                <Select
                                  value={session.teacherId || "none"}
                                  onValueChange={(value) =>
                                    updateManualSession(index, "teacherId", value === "none" ? undefined : value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No teacher</SelectItem>
                                    {teachers.map((teacher) => (
                                      <SelectItem key={teacher.id} value={teacher.id}>
                                        {teacher.name || teacher.email}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Date</Label>
                                <Input
                                  type="date"
                                  value={session.date}
                                  onChange={(e) => updateManualSession(index, "date", e.target.value)}
                                  min={form.getValues("startDate")}
                                  max={form.getValues("endDate")}
                                />
                              </div>

                              <div>
                                <Label>Start Time</Label>
                                <Select
                                  value={session.startTime}
                                  onValueChange={(value) => updateManualSession(index, "startTime", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TIME_SLOTS.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="col-span-2">
                                <Label>Notes (Optional)</Label>
                                <Textarea
                                  value={session.notes || ""}
                                  onChange={(e) => updateManualSession(index, "notes", e.target.value)}
                                  placeholder="Add notes..."
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save Template */}
            {!hasTemplateSelected && (
              <div className="shrink-0 space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Star className="text-muted-foreground h-4 w-4" />
                  <Label className="text-sm font-medium">Save as Template</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter template name..."
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={handleSaveTemplate} disabled={!templateName.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Template
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Sessions"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

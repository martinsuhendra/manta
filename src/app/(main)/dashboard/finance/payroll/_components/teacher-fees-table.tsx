/* eslint-disable max-lines, complexity */
"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, HelpCircle, Loader2, Pencil, Plus, Search, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useItems } from "@/hooks/use-items-query";
import { useTeachers } from "@/hooks/use-users-query";
import { type TeacherFeeModel, TeacherFeeModel as TeacherFeeModelConst } from "@/lib/teacher-fee-model";
import { cn, formatPrice } from "@/lib/utils";

interface TeacherFeeRow {
  id: string;
  teacherId: string;
  itemId: string;
  feeModel: TeacherFeeModel;
  feeAmount: number;
  perParticipantMinGuarantee: number | null;
  perParticipantGuaranteeMaxPax: number | null;
  teacher: { id: string; name: string | null; email: string | null; image?: string | null };
  item: { id: string; name: string };
}

interface TeacherPreview {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
}

function teacherInitials(name: string | null | undefined, email: string | null | undefined) {
  const n = (name ?? "").trim();
  if (n && n !== "NO_NAME") {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

function teacherDisplayName(name: string | null | undefined) {
  const n = (name ?? "").trim();
  if (!n || n === "NO_NAME") return null;
  return n;
}

function TeacherContextCard({
  teacher,
  classLabel,
  classPending,
  cardClassName,
}: {
  teacher: TeacherPreview;
  classLabel: string;
  classPending?: boolean;
  cardClassName?: string;
}) {
  const title = teacherDisplayName(teacher.name) ?? teacher.email ?? "Teacher";

  return (
    <div
      className={cn(
        "bg-card/80 flex gap-4 rounded-xl border p-4 shadow-sm backdrop-blur-sm",
        classPending && "border-dashed",
        cardClassName,
      )}
    >
      <Avatar className="border-background ring-border size-14 shrink-0 border-2 shadow-md ring-1">
        <AvatarImage src={teacher.image ?? undefined} alt="" />
        <AvatarFallback className="text-base font-semibold">
          {teacherInitials(teacher.name, teacher.email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold tracking-tight">{title}</p>
        {teacher.email && teacherDisplayName(teacher.name) ? (
          <p className="text-muted-foreground truncate text-sm">{teacher.email}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="max-w-full gap-1.5 font-normal">
            <BookOpen className="size-3.5 shrink-0 opacity-70" />
            <span className="truncate">{classPending ? "Select a class below…" : classLabel}</span>
          </Badge>
        </div>
      </div>
    </div>
  );
}

function feeModelBadgeVariant(model: TeacherFeeModel): "default" | "secondary" {
  return model === TeacherFeeModelConst.PER_PARTICIPANT ? "secondary" : "default";
}

function feeModelShortLabel(model: TeacherFeeModel): string {
  return model === TeacherFeeModelConst.PER_PARTICIPANT ? "Per person" : "Flat / session";
}

interface TeacherFeesTableProps {
  teacherId?: string;
  readOnly?: boolean;
}

export function TeacherFeesTable({ teacherId, readOnly = false }: TeacherFeesTableProps = {}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TeacherFeeRow | null>(null);
  const [editFeeAmount, setEditFeeAmount] = useState(0);
  const [editFeeModel, setEditFeeModel] = useState<TeacherFeeModel>(TeacherFeeModelConst.FLAT_PER_SESSION);
  const [editGuaranteeEnabled, setEditGuaranteeEnabled] = useState(false);
  const [editMinGuarantee, setEditMinGuarantee] = useState(0);
  const [editGuaranteeMaxPax, setEditGuaranteeMaxPax] = useState(2);
  const [addOpen, setAddOpen] = useState(false);
  const [addTeacherId, setAddTeacherId] = useState("");
  const [addItemId, setAddItemId] = useState("");
  const [addFeeAmount, setAddFeeAmount] = useState(0);
  const [addFeeModel, setAddFeeModel] = useState<TeacherFeeModel>(TeacherFeeModelConst.FLAT_PER_SESSION);
  const [addGuaranteeEnabled, setAddGuaranteeEnabled] = useState(false);
  const [addMinGuarantee, setAddMinGuarantee] = useState(0);
  const [addGuaranteeMaxPax, setAddGuaranteeMaxPax] = useState(2);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  const { data: teachers = [] } = useTeachers(!readOnly);
  const { data: items = [] } = useItems({ enabled: !readOnly });

  const { data: rows = [], isLoading } = useQuery<TeacherFeeRow[]>({
    queryKey: ["payroll-teacher-fees", teacherId ?? "all"],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (teacherId) search.set("teacherId", teacherId);
      const res = await fetch(`/api/admin/payroll/teacher-fees${search.toString() ? `?${search.toString()}` : ""}`);
      if (!res.ok) throw new Error("Failed to load teacher fees");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      teacherId: string;
      itemId: string;
      feeAmount: number;
      feeModel: TeacherFeeModel;
      perParticipantMinGuarantee?: number;
      perParticipantGuaranteeMaxPax?: number;
    }) => {
      const res = await fetch("/api/admin/payroll/teacher-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = [err?.error, err?.details].filter(Boolean).join(" — ");
        throw new Error(msg || "Failed to add");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-teacher-fees"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      setAddOpen(false);
      setAddTeacherId("");
      setAddItemId("");
      setAddFeeAmount(0);
      setAddFeeModel(TeacherFeeModelConst.FLAT_PER_SESSION);
      setAddGuaranteeEnabled(false);
      setAddMinGuarantee(0);
      setAddGuaranteeMaxPax(2);
      toast.success("Teacher fee config added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (body: {
      id: string;
      feeAmount: number;
      feeModel: TeacherFeeModel;
      perParticipantMinGuarantee?: number | null;
      perParticipantGuaranteeMaxPax?: number | null;
    }) => {
      const { id, ...patch } = body;
      const res = await fetch(`/api/admin/payroll/teacher-fees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = [err?.error, err?.details].filter(Boolean).join(" — ");
        throw new Error(msg || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-teacher-fees"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-summary"] });
      setEditing(null);
      toast.success("Fee updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filteredRows = useMemo(() => {
    const q = teacherSearchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        (row.teacher.name?.toLowerCase().includes(q) ?? false) ||
        (row.teacher.email?.toLowerCase().includes(q) ?? false),
    );
  }, [rows, teacherSearchQuery]);

  const addConflictRow = useMemo(() => {
    if (!addTeacherId || !addItemId) return null;
    return rows.find((r) => r.teacherId === addTeacherId && r.itemId === addItemId) ?? null;
  }, [rows, addTeacherId, addItemId]);

  const openEdit = (row: TeacherFeeRow) => {
    setEditing(row);
    setEditFeeAmount(row.feeAmount);
    setEditFeeModel(row.feeModel);
    const hasFloor =
      row.feeModel === TeacherFeeModelConst.PER_PARTICIPANT &&
      row.perParticipantMinGuarantee != null &&
      row.perParticipantGuaranteeMaxPax != null;
    setEditGuaranteeEnabled(hasFloor);
    setEditMinGuarantee(row.perParticipantMinGuarantee ?? 0);
    setEditGuaranteeMaxPax(row.perParticipantGuaranteeMaxPax ?? 2);
  };

  const handleSave = () => {
    if (!editing) return;
    if (editFeeAmount < 0) {
      toast.error("Enter a non-negative amount (IDR)");
      return;
    }
    if (editFeeModel === TeacherFeeModelConst.PER_PARTICIPANT && editGuaranteeEnabled) {
      if (editGuaranteeMaxPax < 1 || !Number.isInteger(editGuaranteeMaxPax)) {
        toast.error("Max participants for the floor must be a whole number ≥ 1");
        return;
      }
      if (editMinGuarantee < 0) {
        toast.error("Minimum floor must be ≥ 0 IDR");
        return;
      }
    }
    const base = { id: editing.id, feeAmount: editFeeAmount, feeModel: editFeeModel };
    if (editFeeModel === TeacherFeeModelConst.PER_PARTICIPANT) {
      if (editGuaranteeEnabled) {
        updateMutation.mutate({
          ...base,
          perParticipantMinGuarantee: editMinGuarantee,
          perParticipantGuaranteeMaxPax: editGuaranteeMaxPax,
        });
        return;
      }
      updateMutation.mutate({
        ...base,
        perParticipantMinGuarantee: null,
        perParticipantGuaranteeMaxPax: null,
      });
      return;
    }
    updateMutation.mutate(base);
  };

  const handleAdd = () => {
    if (!addTeacherId || !addItemId) {
      toast.error("Select a teacher and a class");
      return;
    }
    if (addConflictRow) {
      toast.error(
        `A fee config already exists for ${addConflictRow.teacher.name ?? addConflictRow.teacher.email ?? "this teacher"} and “${addConflictRow.item.name}”. Edit the existing row in the table.`,
      );
      return;
    }
    if (addFeeAmount < 0) {
      toast.error("Fee must be a non-negative amount (IDR)");
      return;
    }
    if (addFeeModel === TeacherFeeModelConst.PER_PARTICIPANT && addGuaranteeEnabled) {
      if (addGuaranteeMaxPax < 1 || !Number.isInteger(addGuaranteeMaxPax)) {
        toast.error("Max participants for the floor must be a whole number ≥ 1");
        return;
      }
      if (addMinGuarantee < 0) {
        toast.error("Minimum floor must be ≥ 0 IDR");
        return;
      }
    }
    createMutation.mutate({
      teacherId: addTeacherId,
      itemId: addItemId,
      feeAmount: addFeeAmount,
      feeModel: addFeeModel,
      ...(addFeeModel === TeacherFeeModelConst.PER_PARTICIPANT && addGuaranteeEnabled
        ? { perParticipantMinGuarantee: addMinGuarantee, perParticipantGuaranteeMaxPax: addGuaranteeMaxPax }
        : {}),
    });
  };

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading teacher fees…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <>
        <p className="text-muted-foreground mb-4 text-sm">
          Configure how each teacher is paid per class: a fixed amount per completed session, or an amount multiplied by
          billable participants (confirmed / completed bookings). These rules feed the payroll summary.
        </p>
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center">
          <p>No teacher–class fee configs yet.</p>
          {!readOnly && <p className="mt-1 text-sm">Add a teacher and class to set fees used for payroll.</p>}
          {!readOnly && (
            <Button className="mt-4" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add teacher fee config
            </Button>
          )}
        </div>
        {!readOnly && (
          <AddFeeDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            teachers={teachers}
            items={items}
            addTeacherId={addTeacherId}
            setAddTeacherId={setAddTeacherId}
            addItemId={addItemId}
            setAddItemId={setAddItemId}
            addFeeAmount={addFeeAmount}
            setAddFeeAmount={setAddFeeAmount}
            addFeeModel={addFeeModel}
            setAddFeeModel={(v) => {
              setAddFeeModel(v);
              if (v === TeacherFeeModelConst.FLAT_PER_SESSION) setAddGuaranteeEnabled(false);
            }}
            addGuaranteeEnabled={addGuaranteeEnabled}
            setAddGuaranteeEnabled={setAddGuaranteeEnabled}
            addMinGuarantee={addMinGuarantee}
            setAddMinGuarantee={setAddMinGuarantee}
            addGuaranteeMaxPax={addGuaranteeMaxPax}
            setAddGuaranteeMaxPax={setAddGuaranteeMaxPax}
            conflictRow={addConflictRow}
            onSubmit={handleAdd}
            isPending={createMutation.isPending}
          />
        )}
      </>
    );
  }

  return (
    <>
      <p className="text-muted-foreground mb-4 text-sm">
        Set fee type per teacher and class: flat per completed session, or per participant (sum of participant counts on
        confirmed / completed bookings). Payroll uses these when sessions are marked completed.
      </p>
      {!readOnly && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs min-w-[200px] flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search by teacher name..."
              value={teacherSearchQuery}
              onChange={(e) => setTeacherSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add teacher fee config
          </Button>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Session (class)</TableHead>
              <TableHead className="w-[130px]">Fee type</TableHead>
              <TableHead className="min-w-[160px] text-right">Amount</TableHead>
              <TableHead className="min-w-[140px]">
                <span className="inline-flex items-center gap-1.5">
                  Small class minimum
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground inline-flex shrink-0"
                        aria-label="What is small class minimum?"
                      >
                        <HelpCircle className="size-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-left leading-relaxed">
                      For per-person pay: “Pay by headcount only” means rate × people every time. If you turn on a
                      minimum, small classes (up to N people) pay one fixed amount instead; bigger classes still use
                      rate × people.
                    </TooltipContent>
                  </Tooltip>
                </span>
              </TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center text-sm">
                  {teacherSearchQuery.trim()
                    ? "No teacher fee configs match your search."
                    : "No teacher fee configs yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="ring-border size-9 shrink-0 ring-1">
                        <AvatarImage src={row.teacher.image ?? undefined} alt="" />
                        <AvatarFallback className="text-xs font-medium">
                          {teacherInitials(row.teacher.name, row.teacher.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium">
                          {teacherDisplayName(row.teacher.name) ?? row.teacher.email ?? "—"}
                        </p>
                        {row.teacher.email && teacherDisplayName(row.teacher.name) ? (
                          <p className="text-muted-foreground truncate text-xs">{row.teacher.email}</p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{row.item.name}</TableCell>
                  <TableCell>
                    <Badge variant={feeModelBadgeVariant(row.feeModel)}>{feeModelShortLabel(row.feeModel)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-baseline justify-end gap-x-2 whitespace-nowrap tabular-nums">
                      <span className="font-semibold">{formatPrice(row.feeAmount)}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {row.feeModel === TeacherFeeModelConst.PER_PARTICIPANT ? "/ pax" : "/ session"}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>
                    {row.feeModel === TeacherFeeModelConst.PER_PARTICIPANT &&
                    row.perParticipantMinGuarantee != null &&
                    row.perParticipantGuaranteeMaxPax != null ? (
                      <div className="text-sm leading-snug">
                        <span className="font-medium tabular-nums">{formatPrice(row.perParticipantMinGuarantee)}</span>
                        <span className="text-muted-foreground"> for {row.perParticipantGuaranteeMaxPax} pax</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!readOnly && (
                      <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!readOnly && (
        <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
          <DialogContent
            className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[95vh] sm:max-w-2xl sm:rounded-lg"
            showCloseButton
          >
            <DialogHeader className="border-b px-4 py-3 pr-10 sm:px-6 sm:py-4">
              <div className="text-primary flex items-center gap-2">
                <Wallet className="size-5" />
                <span className="text-xs font-semibold tracking-wide uppercase">Payroll fee</span>
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight">Edit fee</DialogTitle>
              <DialogDescription>
                Update how this teacher is paid when a session for this class is marked completed.
              </DialogDescription>
              {editing ? (
                <TeacherContextCard teacher={editing.teacher} classLabel={editing.item.name} cardClassName="mt-3" />
              ) : null}
            </DialogHeader>
            {editing ? (
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <FeeModelFields
                  formId="edit-fee"
                  feeModel={editFeeModel}
                  onFeeModelChange={(v) => {
                    setEditFeeModel(v);
                    if (v === TeacherFeeModelConst.FLAT_PER_SESSION) setEditGuaranteeEnabled(false);
                  }}
                  feeAmount={editFeeAmount}
                />
                <Separator />
                <div className="space-y-2">
                  <Label className="text-base font-medium">Amount</Label>
                  <p className="text-muted-foreground text-xs">
                    {editFeeModel === TeacherFeeModelConst.PER_PARTICIPANT
                      ? "Rate per billable participant (IDR). Used when attendance is above the floor cap, or when no floor is set."
                      : "Gross IDR paid according to the rule above."}
                  </p>
                  <CurrencyInput
                    className="h-11 text-base"
                    placeholder="Enter amount in IDR"
                    value={editFeeAmount}
                    onChange={setEditFeeAmount}
                  />
                </div>
                {editFeeModel === TeacherFeeModelConst.PER_PARTICIPANT ? (
                  <PerParticipantLowAttendanceFields
                    formId="edit-fee"
                    enabled={editGuaranteeEnabled}
                    onEnabledChange={setEditGuaranteeEnabled}
                    minGuarantee={editMinGuarantee}
                    onMinGuaranteeChange={setEditMinGuarantee}
                    maxPax={editGuaranteeMaxPax}
                    onMaxPaxChange={setEditGuaranteeMaxPax}
                    ratePerPerson={editFeeAmount}
                  />
                ) : null}
              </div>
            ) : null}
            <DialogFooter className="flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button className="w-full sm:w-auto" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!readOnly && (
        <AddFeeDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          teachers={teachers}
          items={items}
          addTeacherId={addTeacherId}
          setAddTeacherId={setAddTeacherId}
          addItemId={addItemId}
          setAddItemId={setAddItemId}
          addFeeAmount={addFeeAmount}
          setAddFeeAmount={setAddFeeAmount}
          addFeeModel={addFeeModel}
          setAddFeeModel={(v) => {
            setAddFeeModel(v);
            if (v === TeacherFeeModelConst.FLAT_PER_SESSION) setAddGuaranteeEnabled(false);
          }}
          addGuaranteeEnabled={addGuaranteeEnabled}
          setAddGuaranteeEnabled={setAddGuaranteeEnabled}
          addMinGuarantee={addMinGuarantee}
          setAddMinGuarantee={setAddMinGuarantee}
          addGuaranteeMaxPax={addGuaranteeMaxPax}
          setAddGuaranteeMaxPax={setAddGuaranteeMaxPax}
          conflictRow={addConflictRow}
          onSubmit={handleAdd}
          isPending={createMutation.isPending}
        />
      )}
    </>
  );
}

function FeeModelFields({
  feeModel,
  onFeeModelChange,
  feeAmount,
  formId,
}: {
  feeModel: TeacherFeeModel;
  onFeeModelChange: (v: TeacherFeeModel) => void;
  feeAmount: number;
  formId: string;
}) {
  const flatId = `${formId}-fee-flat`;
  const paxId = `${formId}-fee-pax`;

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-medium">How should they be paid?</legend>
      <RadioGroup
        value={feeModel}
        onValueChange={(v) => onFeeModelChange(v as TeacherFeeModel)}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Label
          htmlFor={flatId}
          className={cn(
            "hover:bg-muted/50 block cursor-pointer rounded-xl border-2 p-4 transition-colors",
            feeModel === TeacherFeeModelConst.FLAT_PER_SESSION
              ? "border-primary bg-primary/5 shadow-sm"
              : "bg-muted/30 border-transparent",
          )}
        >
          <span className="flex gap-3">
            <RadioGroupItem value={TeacherFeeModelConst.FLAT_PER_SESSION} id={flatId} className="mt-0.5" />
            <span className="min-w-0">
              <span className="font-medium">Flat per session</span>
              <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                Same IDR for every completed class, regardless of attendance.
              </span>
            </span>
          </span>
        </Label>
        <Label
          htmlFor={paxId}
          className={cn(
            "hover:bg-muted/50 block cursor-pointer rounded-xl border-2 p-4 transition-colors",
            feeModel === TeacherFeeModelConst.PER_PARTICIPANT
              ? "border-primary bg-primary/5 shadow-sm"
              : "bg-muted/30 border-transparent",
          )}
        >
          <span className="flex gap-3">
            <RadioGroupItem value={TeacherFeeModelConst.PER_PARTICIPANT} id={paxId} className="mt-0.5" />
            <span className="min-w-0">
              <span className="font-medium">Per participant</span>
              <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                IDR × billable headcount (confirmed & completed bookings) per session.
              </span>
              {feeModel === TeacherFeeModelConst.PER_PARTICIPANT && feeAmount >= 0 ? (
                <span className="text-muted-foreground bg-background/80 mt-2 block rounded-md px-2 py-1.5 text-xs tabular-nums">
                  e.g. 3 pax × {formatPrice(feeAmount)} = {formatPrice(feeAmount * 3)}
                </span>
              ) : null}
            </span>
          </span>
        </Label>
      </RadioGroup>
    </fieldset>
  );
}

function PerParticipantLowAttendanceFields({
  formId,
  enabled,
  onEnabledChange,
  minGuarantee,
  onMinGuaranteeChange,
  maxPax,
  onMaxPaxChange,
  ratePerPerson,
}: {
  formId: string;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  minGuarantee: number;
  onMinGuaranteeChange: (v: number) => void;
  maxPax: number;
  onMaxPaxChange: (v: number) => void;
  ratePerPerson: number;
}) {
  const maxPaxInputId = `${formId}-guarantee-max-pax`;
  const rateOnlyId = `${formId}-pax-rate-only`;
  const floorId = `${formId}-pax-minimum-floor`;

  return (
    <div className="bg-muted/20 space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">Small class pay rule</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground inline-flex shrink-0"
              aria-label="Small class pay rule help"
            >
              <HelpCircle className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-left leading-relaxed">
            Either pay only by headcount, or set a fixed minimum when only a few people book the class.
          </TooltipContent>
        </Tooltip>
      </div>

      <RadioGroup
        value={enabled ? "floor" : "rate_only"}
        onValueChange={(v) => onEnabledChange(v === "floor")}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Label
          htmlFor={rateOnlyId}
          className={cn(
            "hover:bg-muted/50 block cursor-pointer rounded-xl border-2 p-3 transition-colors",
            !enabled ? "border-primary bg-primary/5 shadow-sm" : "bg-muted/30 border-transparent",
          )}
        >
          <span className="flex gap-3">
            <RadioGroupItem value="rate_only" id={rateOnlyId} className="mt-0.5" />
            <span className="min-w-0">
              <span className="font-medium">Pay by headcount only</span>
              <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                Each session:{" "}
                <span className="text-foreground font-medium tabular-nums">{formatPrice(ratePerPerson)}</span> × how
                many people booked. No extra minimum.
              </span>
            </span>
          </span>
        </Label>
        <Label
          htmlFor={floorId}
          className={cn(
            "hover:bg-muted/50 block cursor-pointer rounded-xl border-2 p-3 transition-colors",
            enabled ? "border-primary bg-primary/5 shadow-sm" : "bg-muted/30 border-transparent",
          )}
        >
          <span className="flex gap-3">
            <RadioGroupItem value="floor" id={floorId} className="mt-0.5" />
            <span className="min-w-0">
              <span className="font-medium">Minimum for small groups</span>
              <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                Up to N people: pay one fixed amount for the session. More than N: pay{" "}
                <span className="text-foreground font-medium tabular-nums">{formatPrice(ratePerPerson)}</span> ×
                headcount.
              </span>
            </span>
          </span>
        </Label>
      </RadioGroup>

      {enabled ? (
        <div className="border-border/60 space-y-4 border-t pt-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Minimum teachers fee (IDR) (per session)</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground inline-flex shrink-0"
                    aria-label="Minimum IDR help"
                  >
                    <HelpCircle className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left leading-relaxed">
                  What the teacher gets for that session when the group is small (1 up to N people).
                </TooltipContent>
              </Tooltip>
            </div>
            <CurrencyInput
              className="h-11"
              placeholder="e.g. 100.000"
              value={minGuarantee}
              onChange={onMinGuaranteeChange}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={maxPaxInputId} className="text-sm font-medium">
                Up to how many people use the minimum?
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground inline-flex shrink-0"
                    aria-label="Max participants help"
                  >
                    <HelpCircle className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left leading-relaxed">
                  If the class has 1, 2, … up to this number of people, the minimum applies. Above that, pay is rate ×
                  people only.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id={maxPaxInputId}
              type="number"
              min={1}
              step={1}
              className="h-11"
              value={maxPax}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                onMaxPaxChange(Number.isFinite(n) && n >= 1 ? n : 1);
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface AddFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: TeacherPreview[];
  items: Array<{ id: string; name: string }>;
  addTeacherId: string;
  setAddTeacherId: (v: string) => void;
  addItemId: string;
  setAddItemId: (v: string) => void;
  addFeeAmount: number;
  setAddFeeAmount: (v: number) => void;
  addFeeModel: TeacherFeeModel;
  setAddFeeModel: (v: TeacherFeeModel) => void;
  addGuaranteeEnabled: boolean;
  setAddGuaranteeEnabled: (v: boolean) => void;
  addMinGuarantee: number;
  setAddMinGuarantee: (v: number) => void;
  addGuaranteeMaxPax: number;
  setAddGuaranteeMaxPax: (v: number) => void;
  conflictRow: TeacherFeeRow | null;
  onSubmit: () => void;
  isPending: boolean;
}

function AddFeeDialog({
  open,
  onOpenChange,
  teachers,
  items,
  addTeacherId,
  setAddTeacherId,
  addItemId,
  setAddItemId,
  addFeeAmount,
  setAddFeeAmount,
  addFeeModel,
  setAddFeeModel,
  addGuaranteeEnabled,
  setAddGuaranteeEnabled,
  addMinGuarantee,
  setAddMinGuarantee,
  addGuaranteeMaxPax,
  setAddGuaranteeMaxPax,
  conflictRow,
  onSubmit,
  isPending,
}: AddFeeDialogProps) {
  const teacherLabel = conflictRow ? (conflictRow.teacher.name ?? conflictRow.teacher.email ?? "This teacher") : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[95vh] sm:max-w-2xl sm:rounded-lg"
        showCloseButton
      >
        <DialogHeader className="border-b px-4 py-3 pr-10 sm:px-6 sm:py-4">
          <div className="text-primary flex items-center gap-2">
            <Wallet className="size-5" />
            <span className="text-xs font-semibold tracking-wide uppercase">New payroll fee</span>
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight">Add teacher fee</DialogTitle>
          <DialogDescription>
            Pick a teacher and class, then set the pay rule and amount. Shown on the payroll summary for completed
            sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {conflictRow ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Already configured</AlertTitle>
              <AlertDescription>
                {teacherLabel} already has a fee for “{conflictRow.item.name}”. Close this dialog and tap{" "}
                <span className="font-medium">Edit</span> on that row.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Teacher</Label>
              <Select value={addTeacherId || "none"} onValueChange={(v) => setAddTeacherId(v === "none" ? "" : v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose teacher" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose teacher</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="py-2">
                      <span className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarImage src={t.image ?? undefined} alt="" />
                          <AvatarFallback className="text-[10px]">{teacherInitials(t.name, t.email)}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{teacherDisplayName(t.name) ?? t.email ?? t.id}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Class</Label>
              <Select value={addItemId || "none"} onValueChange={(v) => setAddItemId(v === "none" ? "" : v)}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Choose class</SelectItem>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="flex items-center gap-2">
                        <BookOpen className="text-muted-foreground size-4 shrink-0" />
                        {item.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <FeeModelFields
            formId="add-fee"
            feeModel={addFeeModel}
            onFeeModelChange={setAddFeeModel}
            feeAmount={addFeeAmount}
          />

          <Separator />

          <div className="space-y-2">
            <Label className="text-base font-medium">Amount</Label>
            <p className="text-muted-foreground text-xs">
              {addFeeModel === TeacherFeeModelConst.PER_PARTICIPANT
                ? "Rate per billable participant (IDR). Used above the floor cap, or when no floor is set."
                : "Gross IDR before tax or deductions."}
            </p>
            <CurrencyInput
              className="h-11 text-base"
              placeholder="Enter amount in IDR"
              value={addFeeAmount}
              onChange={setAddFeeAmount}
            />
          </div>

          {addFeeModel === TeacherFeeModelConst.PER_PARTICIPANT ? (
            <PerParticipantLowAttendanceFields
              formId="add-fee"
              enabled={addGuaranteeEnabled}
              onEnabledChange={setAddGuaranteeEnabled}
              minGuarantee={addMinGuarantee}
              onMinGuaranteeChange={setAddMinGuarantee}
              maxPax={addGuaranteeMaxPax}
              onMaxPaxChange={setAddGuaranteeMaxPax}
              ratePerPerson={addFeeAmount}
            />
          ) : null}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end sm:px-6 sm:py-4">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={onSubmit} disabled={isPending || !!conflictRow}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

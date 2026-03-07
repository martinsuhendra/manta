"use client";

import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useItems } from "@/hooks/use-items-query";
import { useTeachers } from "@/hooks/use-users-query";
import { formatPrice } from "@/lib/utils";

interface TeacherFeeRow {
  id: string;
  teacherId: string;
  itemId: string;
  feeAmount: number;
  teacher: { id: string; name: string | null; email: string | null };
  item: { id: string; name: string };
}

export function TeacherFeesTable() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<TeacherFeeRow | null>(null);
  const [editFeeAmount, setEditFeeAmount] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [addTeacherId, setAddTeacherId] = useState("");
  const [addItemId, setAddItemId] = useState("");
  const [addFeeAmount, setAddFeeAmount] = useState(0);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");

  const { data: teachers = [] } = useTeachers();
  const { data: items = [] } = useItems();

  const { data: rows = [], isLoading } = useQuery<TeacherFeeRow[]>({
    queryKey: ["payroll-teacher-fees"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payroll/teacher-fees");
      if (!res.ok) throw new Error("Failed to load teacher fees");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { teacherId: string; itemId: string; feeAmount: number }) => {
      const res = await fetch("/api/admin/payroll/teacher-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to add");
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
      toast.success("Teacher fee config added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, feeAmount }: { id: string; feeAmount: number }) => {
      const res = await fetch(`/api/admin/payroll/teacher-fees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeAmount }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to update");
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

  const openEdit = (row: TeacherFeeRow) => {
    setEditing(row);
    setEditFeeAmount(row.feeAmount);
  };

  const handleSave = () => {
    if (!editing) return;
    if (editFeeAmount < 0) {
      toast.error("Enter a non-negative amount (IDR)");
      return;
    }
    updateMutation.mutate({ id: editing.id, feeAmount: editFeeAmount });
  };

  const handleAdd = () => {
    if (!addTeacherId || !addItemId) {
      toast.error("Select a teacher and a class");
      return;
    }
    if (addFeeAmount < 0) {
      toast.error("Fee must be a non-negative amount (IDR)");
      return;
    }
    createMutation.mutate({
      teacherId: addTeacherId,
      itemId: addItemId,
      feeAmount: addFeeAmount,
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
          Configure which teachers can teach which classes and their fee per session (IDR). Add a teacher–class
          assignment below to set fees used for payroll.
        </p>
        <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center">
          <p>No teacher–class fee configs yet.</p>
          <p className="mt-1 text-sm">Add a teacher and class to set their fee for payroll.</p>
          <Button className="mt-4" onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add teacher fee config
          </Button>
        </div>
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
          onSubmit={handleAdd}
          isPending={createMutation.isPending}
        />
      </>
    );
  }

  return (
    <>
      <p className="text-muted-foreground mb-4 text-sm">
        Configure which teachers can teach which classes and their fee per session (IDR). These values are used for
        payroll totals in the Summary tab.
      </p>
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher</TableHead>
              <TableHead>Session (class)</TableHead>
              <TableHead className="w-[120px] text-right">Fee (IDR)</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-sm">
                  {teacherSearchQuery.trim()
                    ? "No teacher fee configs match your search."
                    : "No teacher fee configs yet."}
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{row.teacher.name ?? "—"}</p>
                      {row.teacher.email && <p className="text-muted-foreground text-xs">{row.teacher.email}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{row.item.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatPrice(row.feeAmount)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit teacher fee</DialogTitle>
            <DialogDescription>
              Fee per session in IDR. This amount is paid to the teacher for each session they teach.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-2">
              <Label>Fee (IDR)</Label>
              <CurrencyInput placeholder="Enter fee in IDR" value={editFeeAmount} onChange={setEditFeeAmount} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        onSubmit={handleAdd}
        isPending={createMutation.isPending}
      />
    </>
  );
}

interface AddFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: Array<{ id: string; name: string | null; email: string | null }>;
  items: Array<{ id: string; name: string }>;
  addTeacherId: string;
  setAddTeacherId: (v: string) => void;
  addItemId: string;
  setAddItemId: (v: string) => void;
  addFeeAmount: number;
  setAddFeeAmount: (v: number) => void;
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
  onSubmit,
  isPending,
}: AddFeeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add teacher fee config</DialogTitle>
          <DialogDescription>
            Assign a teacher to a class and set their fee per session in IDR. This is used for payroll.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Select value={addTeacherId || "none"} onValueChange={(v) => setAddTeacherId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select teacher</SelectItem>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name ?? t.email ?? t.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={addItemId || "none"} onValueChange={(v) => setAddItemId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select class</SelectItem>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fee (IDR)</Label>
            <CurrencyInput placeholder="Enter fee in IDR" value={addFeeAmount} onChange={setAddFeeAmount} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

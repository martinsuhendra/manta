"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";

import { Plus, Calendar as CalendarIcon, List, Layers } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { USER_ROLES } from "@/lib/types";

import { BulkSessionDialog } from "./bulk-session-dialog";
import { PrivateSessionDialog } from "./private-session-dialog";
import { Session, SessionFilter } from "./schema";
import { SessionCalendar, type DateSelectMeta } from "./session-calendar";
import { SessionDialog } from "./session-dialog";
import { SessionFilters } from "./session-filters";
import { SessionList } from "./session-list";
import { shouldBlockOpenEditForSession } from "./session-open-edit-guard";

export function SessionsView() {
  const { data: authSession } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isPrivateDialogOpen, setIsPrivateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [filters, setFilters] = useState<SessionFilter>({});
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [prefillStartTime, setPrefillStartTime] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState("calendar");
  const sessionReadOnly = authSession?.user?.role === USER_ROLES.TEACHER;
  const canManagePublicSessions = !sessionReadOnly;

  useEffect(() => {
    if (authSession?.user?.role === USER_ROLES.TEACHER && authSession.user.id) {
      setFilters((f) => ({ ...f, teacherId: authSession.user.id }));
    }
  }, [authSession?.user?.role, authSession?.user?.id]);

  /** Clears create/edit form identity when the dialog closes without using the success path. */
  const clearEditingAndPrefill = useCallback(() => {
    setEditingSession(null);
    setPrefillStartTime(undefined);
  }, []);

  const handleSessionDialogOpenChange = useCallback(
    (open: boolean) => {
      setIsDialogOpen(open);
      if (!open) clearEditingAndPrefill();
    },
    [clearEditingAndPrefill],
  );

  const handleCreateSession = useCallback(() => {
    clearEditingAndPrefill();
    setIsDialogOpen(true);
  }, [clearEditingAndPrefill]);

  const handleDialogClose = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedDate(undefined);
    clearEditingAndPrefill();
  }, [clearEditingAndPrefill]);

  const handleDateSelect = useCallback(
    (date: Date, hasSessions?: boolean, _sessions?: unknown[], meta?: DateSelectMeta) => {
      setSelectedDate(date);
      if (meta?.silent) return;
      if (sessionReadOnly) return;
      if (!hasSessions) {
        setEditingSession(null);
        setPrefillStartTime(meta?.defaultStartTime);
        setIsDialogOpen(true);
      }
    },
    [sessionReadOnly],
  );

  const handleFilterChange = useCallback((newFilters: SessionFilter) => {
    setFilters(newFilters);
  }, []);

  const handleEditSession = useCallback(
    (session: Session) => {
      if (!canManagePublicSessions) return;
      if (shouldBlockOpenEditForSession(session.id)) return;

      setEditingSession(session);
      setPrefillStartTime(undefined);
      setSelectedDate(new Date(session.date));
      setIsDialogOpen(true);
    },
    [canManagePublicSessions],
  );
  const noopSessionHandler = useCallback(() => {}, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <SessionFilters
              appliedFilters={filters}
              onFilterChange={handleFilterChange}
              hideTeacherFilter={sessionReadOnly}
              hideItemFilter={sessionReadOnly}
            />
            <TabsList>
              <TabsTrigger value="calendar" className="cursor-pointer">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Time Table View
              </TabsTrigger>
              <TabsTrigger value="list" className="cursor-pointer">
                <List className="mr-2 h-4 w-4" />
                List View
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="ml-auto flex shrink-0 flex-wrap gap-2">
            {canManagePublicSessions && (
              <Button variant="outline" onClick={() => setIsPrivateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Private Session
              </Button>
            )}
            {canManagePublicSessions && (
              <>
                <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)}>
                  <Layers className="mr-2 h-4 w-4" />
                  Bulk Create
                </Button>
                <Button onClick={handleCreateSession}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Session
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="calendar" className="space-y-4">
          <SessionCalendar
            filters={filters}
            onDateSelect={handleDateSelect}
            onSessionSelect={canManagePublicSessions ? handleEditSession : noopSessionHandler}
            onEditSession={canManagePublicSessions ? handleEditSession : undefined}
            readOnly={sessionReadOnly}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <SessionList
            filters={filters}
            onEditSession={canManagePublicSessions ? handleEditSession : undefined}
            readOnly={sessionReadOnly}
          />
        </TabsContent>
      </Tabs>

      {canManagePublicSessions && (
        <SessionDialog
          open={isDialogOpen}
          onOpenChange={handleSessionDialogOpenChange}
          selectedDate={selectedDate}
          editingSession={editingSession}
          prefillStartTime={prefillStartTime}
          onSuccess={handleDialogClose}
        />
      )}

      {canManagePublicSessions && (
        <BulkSessionDialog
          open={isBulkDialogOpen}
          onOpenChange={setIsBulkDialogOpen}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {canManagePublicSessions && (
        <PrivateSessionDialog
          open={isPrivateDialogOpen}
          onOpenChange={setIsPrivateDialogOpen}
          onSuccess={() => {
            setIsPrivateDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { useState } from "react";

import { Plus, Calendar as CalendarIcon, List, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BulkSessionDialog } from "./bulk-session-dialog";
import { Session, SessionFilter } from "./schema";
import { SessionCalendar } from "./session-calendar";
import { SessionDialog } from "./session-dialog";
import { SessionFilters } from "./session-filters";
import { SessionList } from "./session-list";

export function SessionsView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [filters, setFilters] = useState<SessionFilter>({});
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState("calendar");

  const handleCreateSession = () => {
    setEditingSession(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedDate(undefined);
    setEditingSession(null);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- session list not needed for date selection
  const handleDateSelect = (date: Date, hasSessions?: boolean, sessions?: unknown[]) => {
    setSelectedDate(date);
    if (!hasSessions) {
      setIsDialogOpen(true);
    }
  };

  const handleFilterChange = (newFilters: SessionFilter) => {
    setFilters(newFilters);
  };

  const handleEditSession = (session: Session) => {
    console.log("Editing session:", session);
    setEditingSession(session);
    // Set the selected date to the session's date
    setSelectedDate(new Date(session.date));
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between gap-2">
        {activeTab === "list" && <SessionFilters appliedFilters={filters} onFilterChange={handleFilterChange} />}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)}>
            <Layers className="mr-2 h-4 w-4" />
            Bulk Create
          </Button>
          <Button onClick={handleCreateSession}>
            <Plus className="mr-2 h-4 w-4" />
            Create Session
          </Button>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar" className="cursor-pointer">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list" className="cursor-pointer">
            <List className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <SessionCalendar
            filters={filters}
            onDateSelect={handleDateSelect}
            onSessionSelect={(session) => {
              // Handle session selection for editing
              console.log("Selected session:", session);
            }}
            onEditSession={handleEditSession}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <SessionList filters={filters} onEditSession={handleEditSession} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <SessionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
        editingSession={editingSession}
        onSuccess={handleDialogClose}
      />

      {/* Bulk Create Dialog */}
      <BulkSessionDialog
        open={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
        onSuccess={() => {
          // Refresh the view after bulk creation
          window.location.reload();
        }}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { useState } from "react";

import { Plus, Calendar as CalendarIcon, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SessionFilter } from "./schema";
import { SessionCalendar } from "./session-calendar";
import { SessionDialog } from "./session-dialog";
import { SessionFilters } from "./session-filters";
import { SessionList } from "./session-list";

export function SessionsView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [filters, setFilters] = useState<SessionFilter>({});
  const [editingSession, setEditingSession] = useState<any | null>(null);
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

  const handleDateSelect = (date: Date, hasSessions?: boolean, sessions?: any[]) => {
    setSelectedDate(date);
    if (!hasSessions) {
      setIsDialogOpen(true);
    }
  };

  const handleFilterChange = (newFilters: SessionFilter) => {
    setFilters(newFilters);
  };

  const handleEditSession = (session: any) => {
    console.log("Editing session:", session);
    setEditingSession(session);
    // Set the selected date to the session's date
    setSelectedDate(new Date(session.date));
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        {activeTab === "list" && <SessionFilters onFilterChange={handleFilterChange} />}
        <Button onClick={handleCreateSession} className={activeTab === "calendar" ? "ml-auto" : ""}>
          <Plus className="mr-2 h-4 w-4" />
          Create Session
        </Button>
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
    </div>
  );
}

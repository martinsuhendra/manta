"use client";

import * as React from "react";
import { useState } from "react";

import { Plus, Calendar as CalendarIcon, List } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DayDetailsDialog } from "./day-details-dialog";
import { SessionFilter } from "./schema";
import { SessionCalendar } from "./session-calendar";
import { SessionDialog } from "./session-dialog";
import { SessionFilters } from "./session-filters";
import { SessionList } from "./session-list";

export function SessionsView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [filters, setFilters] = useState<SessionFilter>({});
  const [showDayDetails, setShowDayDetails] = useState(false);
  const [selectedDateSessions, setSelectedDateSessions] = useState<any[]>([]);

  const handleCreateSession = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedDate(undefined);
  };

  const handleDateSelect = (date: Date, hasSessions?: boolean, sessions?: any[]) => {
    setSelectedDate(date);
    if (hasSessions && sessions && sessions.length > 0) {
      setSelectedDateSessions(sessions);
      setShowDayDetails(true);
    } else {
      setIsDialogOpen(true);
    }
  };

  const handleFilterChange = (newFilters: SessionFilter) => {
    setFilters(newFilters);
  };

  const handleCloseDayDetails = () => {
    setShowDayDetails(false);
    setSelectedDateSessions([]);
  };

  const handleCreateFromDayDetails = () => {
    setShowDayDetails(false);
    setIsDialogOpen(true);
  };

  const handleEditFromDayDetails = (session: any) => {
    setShowDayDetails(false);
    // TODO: Implement edit session functionality
    console.log("Edit session:", session);
  };

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <SessionFilters onFilterChange={handleFilterChange} />
        <Button onClick={handleCreateSession}>
          <Plus className="mr-2 h-4 w-4" />
          Create Session
        </Button>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list">
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
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <SessionList filters={filters} />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <SessionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
        onSuccess={handleDialogClose}
      />

      {/* Day Details Dialog */}
      <DayDetailsDialog
        open={showDayDetails}
        onOpenChange={handleCloseDayDetails}
        date={selectedDate}
        sessions={selectedDateSessions}
        onCreateSession={handleCreateFromDayDetails}
        onEditSession={handleEditFromDayDetails}
        onRefresh={() => {}} // TanStack Query handles automatic refreshing
      />
    </div>
  );
}

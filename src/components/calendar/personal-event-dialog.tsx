"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUserEvent,
  deleteUserEvent,
  updateUserEvent,
  PERSONAL_EVENT_CATEGORIES,
  type PersonalEvent,
  type PersonalEventCategory,
} from "@/lib/user-events";

interface PersonalEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: PersonalEvent | null;
  defaultDate: string;
  onSaved: (event: PersonalEvent) => void;
  onDeleted: (id: string) => void;
}

export function PersonalEventDialog({
  open,
  onOpenChange,
  event,
  defaultDate,
  onSaved,
  onDeleted,
}: PersonalEventDialogProps) {
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(defaultDate);
  const [category, setCategory] = React.useState<PersonalEventCategory>("deadline");
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastResetKey, setLastResetKey] = React.useState<string | null>(null);

  // Re-fill the form during render (not an effect) each time the dialog
  // opens, or opens for a different event, so there's no stale-data flash.
  const resetKey = open ? event?.id ?? "new" : null;
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    if (open) {
      setTitle(event?.title ?? "");
      setDate(event?.date ?? defaultDate);
      setCategory(event?.category ?? "deadline");
      setNotes(event?.notes ?? "");
      setError(null);
    }
  }

  async function handleSave() {
    if (!title.trim() || !date) return;
    setSaving(true);
    setError(null);
    try {
      const input = {
        title: title.trim(),
        date,
        category,
        notes: notes.trim() || null,
      };
      const saved = event
        ? await updateUserEvent(event.id, input)
        : await createUserEvent(input);
      onSaved(saved);
      onOpenChange(false);
    } catch {
      setError("Couldn't save this event. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!event) return;
    setSaving(true);
    setError(null);
    try {
      await deleteUserEvent(event.id);
      onDeleted(event.id);
      onOpenChange(false);
    } catch {
      setError("Couldn't delete this event. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? "Edit event" : "Add event"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="personal-event-title">Title</Label>
            <Input
              id="personal-event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Application deadline"
              maxLength={120}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="personal-event-date">Date</Label>
            <Input
              id="personal-event-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="personal-event-category">Category</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as PersonalEventCategory)}
            >
              <SelectTrigger id="personal-event-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSONAL_EVENT_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="personal-event-notes">Notes</Label>
            <textarea
              id="personal-event-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              placeholder="Optional"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          {event && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              className="sm:mr-auto"
            >
              Delete
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || !date}
          >
            {event ? "Save changes" : "Add event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

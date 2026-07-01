"use client";

import * as React from "react";
import { LocateFixed } from "lucide-react";

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
import { deleteUserHome, upsertUserHome, type UserHome } from "@/lib/user-places";

interface UserHomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  home: UserHome | null;
  onSaved: (home: UserHome) => void;
  onDeleted: () => void;
}

export function UserHomeDialog({
  open,
  onOpenChange,
  home,
  onSaved,
  onDeleted,
}: UserHomeDialogProps) {
  const [label, setLabel] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [locating, setLocating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [wasOpen, setWasOpen] = React.useState(false);

  // Re-fill the form during render (not an effect) each time the dialog
  // opens, so there's no stale-data flash.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLabel(home?.label ?? "Home");
      setLat(home ? String(home.lat) : "");
      setLng(home ? String(home.lng) : "");
      setError(null);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      () => {
        setLocating(false);
        setError("Could not read your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const isValid = label.trim() && lat !== "" && lng !== "" && !Number.isNaN(latNum) && !Number.isNaN(lngNum);

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await upsertUserHome({ label: label.trim(), lat: latNum, lng: lngNum });
      onSaved(saved);
      onOpenChange(false);
    } catch {
      setError("Couldn't save your home location. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError(null);
    try {
      await deleteUserHome();
      onDeleted();
      onOpenChange(false);
    } catch {
      setError("Couldn't remove your home location. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{home ? "Edit home location" : "Set home location"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="user-home-label">Label</Label>
            <Input
              id="user-home-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Home"
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="user-home-lat">Latitude</Label>
              <Input
                id="user-home-lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="user-home-lng">Longitude</Label>
              <Input
                id="user-home-lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={useCurrentLocation}
            disabled={locating}
            className="justify-self-start gap-1.5"
          >
            <LocateFixed className="size-3.5" />
            {locating ? "Locating..." : "Use my current location"}
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          {home && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              className="sm:mr-auto"
            >
              Remove
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {home ? "Save changes" : "Set home"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

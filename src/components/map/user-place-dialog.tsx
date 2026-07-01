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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLACE_TYPE_LABELS, PLACE_TYPES, type PlaceType } from "@/lib/types";
import {
  createUserPlace,
  deleteUserPlace,
  updateUserPlace,
  type UserPlaceRow,
} from "@/lib/user-places";

function normalizeCity(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, "_");
}

interface UserPlaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place: UserPlaceRow | null;
  onSaved: (place: UserPlaceRow) => void;
  onDeleted: (id: string) => void;
}

export function UserPlaceDialog({
  open,
  onOpenChange,
  place,
  onSaved,
  onDeleted,
}: UserPlaceDialogProps) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<PlaceType>("library");
  const [city, setCity] = React.useState("");
  const [lat, setLat] = React.useState("");
  const [lng, setLng] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [note, setNote] = React.useState("");
  const [locating, setLocating] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastResetKey, setLastResetKey] = React.useState<string | null>(null);

  // Re-fill the form during render (not an effect) each time the dialog
  // opens, or opens for a different place, so there's no stale-data flash.
  const resetKey = open ? place?.id ?? "new" : null;
  if (resetKey !== lastResetKey) {
    setLastResetKey(resetKey);
    if (open) {
      setName(place?.name ?? "");
      setType(place?.type ?? "library");
      setCity(place ? place.city.replace(/_/g, " ") : "");
      setLat(place ? String(place.lat) : "");
      setLng(place ? String(place.lng) : "");
      setAddress(place?.address ?? "");
      setNote(place?.note ?? "");
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
  const isValid =
    name.trim() && city.trim() && lat !== "" && lng !== "" && !Number.isNaN(latNum) && !Number.isNaN(lngNum);

  async function handleSave() {
    if (!isValid) return;
    setSaving(true);
    setError(null);
    try {
      const input = {
        name: name.trim(),
        type,
        city: normalizeCity(city),
        lat: latNum,
        lng: lngNum,
        address: address.trim() || null,
        note: note.trim() || null,
      };
      const saved = place
        ? await updateUserPlace(place.id, input)
        : await createUserPlace(input);
      onSaved(saved);
      onOpenChange(false);
    } catch {
      setError("Couldn't save this place. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!place) return;
    setSaving(true);
    setError(null);
    try {
      await deleteUserPlace(place.id);
      onDeleted(place.id);
      onOpenChange(false);
    } catch {
      setError("Couldn't delete this place. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{place ? "Edit place" : "Add place"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="user-place-name">Name</Label>
            <Input
              id="user-place-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Friend's flat, coaching centre..."
              maxLength={120}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="user-place-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as PlaceType)}>
              <SelectTrigger id="user-place-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {PLACE_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="user-place-city">City</Label>
            <Input
              id="user-place-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Mumbai"
              maxLength={60}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="user-place-lat">Latitude</Label>
              <Input
                id="user-place-lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="user-place-lng">Longitude</Label>
              <Input
                id="user-place-lng"
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

          <div className="grid gap-1.5">
            <Label htmlFor="user-place-address">Address</Label>
            <Input
              id="user-place-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Optional"
              maxLength={200}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="user-place-note">Note</Label>
            <textarea
              id="user-place-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              placeholder="Optional"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          {place && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
              className="sm:mr-auto"
            >
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !isValid}>
            {place ? "Save changes" : "Add place"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

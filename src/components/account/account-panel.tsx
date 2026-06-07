"use client";

import * as React from "react";
import { LogOut, MapPin, Plus, Trash2 } from "lucide-react";

import {
  PERSONAL_PIN_TYPES,
  type PersonalPinType,
} from "@/lib/types";
import { PERSONAL_PIN_COLOR } from "@/lib/map";
import { useAccount, type NewPin } from "@/components/account/use-account";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PIN_TYPE_LABELS: Record<PersonalPinType, string> = {
  home: "Home",
  school: "School",
  office: "Office",
  coaching: "Coaching",
  custom: "Custom",
};

const EMPTY_FORM = {
  name: "",
  type: "home" as PersonalPinType,
  lat: "",
  lng: "",
  note: "",
};

export function AccountPanel() {
  const { available, user, pins, loading, signIn, signOut, addPin, deletePin } =
    useAccount();

  if (!available) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts are off on this build</CardTitle>
          <CardDescription>
            Sign-in and private pins need a Supabase project. Everything else
            (map, resources, papers, benefits) works without it. To turn this on,
            follow the setup in the supabase folder, then restart.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading account...</p>;
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save your own places</CardTitle>
          <CardDescription>
            Sign in to pin private spots like home, school, or coaching. They are
            stored against your account only, never shown to anyone else, and
            never mixed into the public map.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={signIn}>Continue with Google</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Signed in as {user.email}
        </p>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>

      <AddPinForm onAdd={addPin} />

      <div className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          Your places ({pins.length})
        </h2>
        {pins.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No private pins yet. Add one above and it shows on the map under the
            My places layer.
          </p>
        ) : (
          <ul className="space-y-2">
            {pins.map((pin) => (
              <li
                key={pin.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <MapPin
                    className="size-4 shrink-0"
                    style={{ color: PERSONAL_PIN_COLOR }}
                  />
                  <div>
                    <p className="text-sm font-medium">{pin.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {PIN_TYPE_LABELS[pin.type]} . {pin.lat.toFixed(4)},{" "}
                      {pin.lng.toFixed(4)}
                      {pin.note ? ` . ${pin.note}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${pin.name}`}
                  onClick={() => deletePin(pin.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function AddPinForm({
  onAdd,
}: {
  onAdd: (pin: NewPin) => Promise<string | null>;
}) {
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        })),
      () => setError("Could not read your location."),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!form.name.trim()) {
      setError("Give the place a name.");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Latitude and longitude must be numbers.");
      return;
    }

    setBusy(true);
    const message = await onAdd({
      name: form.name.trim(),
      type: form.type,
      lat,
      lng,
      note: form.note.trim() || undefined,
    });
    setBusy(false);

    if (message) setError(message);
    else setForm(EMPTY_FORM);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add a private place</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pin-name">Name</Label>
            <Input
              id="pin-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Home"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pin-type">Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                setForm({ ...form, type: value as PersonalPinType })
              }
            >
              <SelectTrigger id="pin-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSONAL_PIN_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {PIN_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pin-lat">Latitude</Label>
            <Input
              id="pin-lat"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
              placeholder="19.0760"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pin-lng">Longitude</Label>
            <Input
              id="pin-lng"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
              placeholder="72.8777"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pin-note">Note (optional)</Label>
            <Input
              id="pin-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Gate 2, ask for the library wing"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive sm:col-span-2">{error}</p>
          )}

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              <Plus className="size-4" />
              {busy ? "Saving..." : "Save place"}
            </Button>
            <Button type="button" variant="outline" onClick={useMyLocation}>
              <MapPin className="size-4" />
              Use my location
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

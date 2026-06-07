"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { PersonalPin, PersonalPinType } from "@/lib/types";

const PIN_COLUMNS = "id,owner_id,name,type,lat,lng,note,created_at";

export interface NewPin {
  name: string;
  type: PersonalPinType;
  lat: number;
  lng: number;
  note?: string;
}

/**
 * Single source of auth + private-pin state, shared by the account page and the
 * map's private layer. Returns inert values (available=false, empty pins) when
 * Supabase is not configured, so callers never need their own guards.
 */
export function useAccount() {
  const available = isSupabaseConfigured();
  const supabase = React.useMemo(
    () => (available ? createClient() : null),
    [available],
  );
  const [user, setUser] = React.useState<User | null>(null);
  const [pins, setPins] = React.useState<PersonalPin[]>([]);
  const [loading, setLoading] = React.useState(available);

  const loadPins = React.useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("personal_pins")
      .select(PIN_COLUMNS)
      .order("created_at", { ascending: false });
    setPins((data ?? []) as PersonalPin[]);
  }, [supabase]);

  React.useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  React.useEffect(() => {
    if (user) loadPins();
    else setPins([]);
  }, [user, loadPins]);

  const signIn = React.useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }, [supabase]);

  const signOut = React.useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  const addPin = React.useCallback(
    async (pin: NewPin): Promise<string | null> => {
      if (!supabase) return "Sign-in is not configured.";
      const { data, error } = await supabase
        .from("personal_pins")
        .insert(pin)
        .select(PIN_COLUMNS)
        .single();
      if (error || !data) return error?.message ?? "Could not save pin.";
      setPins((prev) => [data as PersonalPin, ...prev]);
      return null;
    },
    [supabase],
  );

  const deletePin = React.useCallback(
    async (id: string) => {
      if (!supabase) return;
      await supabase.from("personal_pins").delete().eq("id", id);
      setPins((prev) => prev.filter((pin) => pin.id !== id));
    },
    [supabase],
  );

  return { available, user, pins, loading, signIn, signOut, addPin, deletePin };
}

import { createClient } from "@/lib/supabase/client";
import type { City, Place, PlaceType } from "@/lib/types";

export interface UserPlaceRow {
  id: string;
  user_id: string;
  name: string;
  type: PlaceType;
  city: City;
  lat: number;
  lng: number;
  address: string | null;
  note: string | null;
  created_at: string;
}

export interface UserPlaceInput {
  name: string;
  type: PlaceType;
  city: City;
  lat: number;
  lng: number;
  address: string | null;
  note: string | null;
}

export interface UserHome {
  user_id: string;
  lat: number;
  lng: number;
  label: string;
  updated_at: string;
}

export interface UserHomeInput {
  lat: number;
  lng: number;
  label: string;
}

/** Renders a saved place as a normal map pin, indistinguishable in shape from public places. */
export function userPlaceToPlace(row: UserPlaceRow): Place {
  return {
    id: `own-${row.id}`,
    name: row.name,
    type: row.type,
    city: row.city,
    lat: row.lat,
    lng: row.lng,
    address: row.address ?? undefined,
    gmaps_link: `https://maps.google.com/?q=${row.lat},${row.lng}`,
    added_by: "you",
  };
}

/**
 * Supabase client for the private-data calls below. These only ever run for a
 * signed-in user, which is impossible without Supabase configured, so a null
 * client here means something is badly misconfigured - throw rather than guess.
 */
function requireClient() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

async function currentUserId(): Promise<string> {
  const supabase = requireClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function fetchUserPlaces(): Promise<UserPlaceRow[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("user_places")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createUserPlace(input: UserPlaceInput): Promise<UserPlaceRow> {
  const supabase = requireClient();
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("user_places")
    .insert({ ...input, user_id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserPlace(
  id: string,
  input: UserPlaceInput,
): Promise<UserPlaceRow> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("user_places")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUserPlace(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from("user_places").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchUserHome(): Promise<UserHome | null> {
  const supabase = requireClient();
  const { data, error } = await supabase.from("user_home").select("*").maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertUserHome(input: UserHomeInput): Promise<UserHome> {
  const supabase = requireClient();
  const user_id = await currentUserId();
  const { data, error } = await supabase
    .from("user_home")
    .upsert({ ...input, user_id })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUserHome(): Promise<void> {
  const supabase = requireClient();
  const user_id = await currentUserId();
  const { error } = await supabase.from("user_home").delete().eq("user_id", user_id);
  if (error) throw error;
}

import { createClient } from "@/lib/supabase/client";

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

export type PersonalEventCategory =
  | "deadline"
  | "exam"
  | "assignment"
  | "reminder"
  | "other";

export const PERSONAL_EVENT_CATEGORIES: {
  value: PersonalEventCategory;
  label: string;
}[] = [
  { value: "deadline", label: "Deadline" },
  { value: "exam", label: "Exam" },
  { value: "assignment", label: "Assignment" },
  { value: "reminder", label: "Reminder" },
  { value: "other", label: "Other" },
];

export interface PersonalEvent {
  id: string;
  user_id: string;
  title: string;
  date: string;
  category: PersonalEventCategory;
  notes: string | null;
  created_at: string;
}

export interface PersonalEventInput {
  title: string;
  date: string;
  category: PersonalEventCategory;
  notes: string | null;
}

export async function fetchUserEvents(): Promise<PersonalEvent[]> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("user_events")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createUserEvent(
  input: PersonalEventInput,
): Promise<PersonalEvent> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("user_events")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateUserEvent(
  id: string,
  input: PersonalEventInput,
): Promise<PersonalEvent> {
  const supabase = requireClient();
  const { data, error } = await supabase
    .from("user_events")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUserEvent(id: string): Promise<void> {
  const supabase = requireClient();
  const { error } = await supabase.from("user_events").delete().eq("id", id);
  if (error) throw error;
}

import { createBrowserClient } from "@supabase/ssr";

// Creates a browser-side Supabase client for client components/events.
export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars are missing.");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

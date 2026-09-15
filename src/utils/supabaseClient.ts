import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Single shared Supabase client for the whole app.
//
// This intentionally reads ONLY from build-time env vars (set in the
// AI Studio project's environment/secrets panel, the same way
// GEMINI_API_KEY is set) — never from a form the user pastes a key into.
// The previous version of this app let anyone type a Supabase URL + key
// (including, per its own UI copy, the service_role secret) into a text
// field in the browser. service_role bypasses Row Level Security
// entirely; anyone who opened devtools on this app could have read or
// altered every user's data in the whole Supabase project. That flow has
// been removed. See CloudAuthModal for the real sign-in flow.
const url = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[BudgetTracker] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'The app will run in local-only mode: data stays on this device and will not sync.'
  );
}

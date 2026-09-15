import { supabase } from './supabaseClient';

/**
 * fetch() wrapper for the /api/gemini/* routes. Attaches the signed-in
 * user's Supabase access token so server.ts can verify the request
 * instead of leaving these AI endpoints open to anyone who finds the
 * deployed URL (they call a paid Gemini API key with no rate limiting).
 * When Supabase isn't configured for this deployment at all, no header
 * is sent and the server allows the request through — same local-only
 * fallback behavior as the rest of the app.
 */
export async function callGeminiApi(path: string, body: unknown): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (supabase) {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers['Authorization'] = `Bearer ${data.session.access_token}`;
    }
  }

  return fetch(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

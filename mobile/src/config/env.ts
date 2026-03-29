/**
 * Environment & Supabase Configuration
 *
 * SETUP:
 *  1. Utwórz projekt na https://supabase.com (darmowy tier wystarcza)
 *  2. Uruchom SUPABASE_SETUP.sql w Dashboard → SQL Editor
 *  3. Skopiuj wartości z Dashboard → Settings → API:
 *       - Project URL  → SUPABASE_URL
 *       - anon / public key → SUPABASE_ANON_KEY
 */

// ---------------------------------------------------------------------------
// Supabase credentials – uzupełnij przed pierwszym uruchomieniem
// Ustaw zmienne środowiskowe EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY
// lub skopiuj .env.example do .env.local i uzupełnij wartości
// ---------------------------------------------------------------------------
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// ---------------------------------------------------------------------------
// App-wide config
// ---------------------------------------------------------------------------
export const CONFIG = {
  apiTimeout: 15_000,
};

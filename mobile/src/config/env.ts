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
// ---------------------------------------------------------------------------
export const SUPABASE_URL = 'https://dosqslbiauzznrtnkpvx.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_secret_xUBax8OmtZ49h0K_qlficA_MDXc_zi6';

// ---------------------------------------------------------------------------
// App-wide config
// ---------------------------------------------------------------------------
export const CONFIG = {
  apiTimeout: 15_000,
};

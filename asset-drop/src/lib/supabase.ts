// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and anon key from your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create and export the Supabase client
// This one client can be used across your entire application
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
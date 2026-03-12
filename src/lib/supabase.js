import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

VITE_SUPABASE_URL='https://zldkenrvsckmrqazjsqc.supabase.co'
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZGtlbnJ2c2NrbXJxYXpqc3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTEwMjAsImV4cCI6MjA4ODg2NzAyMH0.U2H4A4aYlxdmWfNGXLmF_UEXGd8pDuwLdFAMvSCMisE
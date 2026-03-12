import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zldkenrvsckmrqazjsqc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsZGtlbnJ2c2NrbXJxYXpqc3FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTEwMjAsImV4cCI6MjA4ODg2NzAyMH0.U2H4A4aYlxdmWfNGXLmF_UEXGd8pDuwLdFAMvSCMisE'

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Export a flag to check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
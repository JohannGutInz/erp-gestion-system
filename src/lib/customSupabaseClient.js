import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://edxkkwbmfzjlxbstaszb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeGtrd2JtZnpqbHhic3Rhc3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NDc5ODEsImV4cCI6MjA4MDAyMzk4MX0.aKNX5m9w9cqQj-y3d2So3gNCYk0TA_rFfmVRxs8g8GU';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};

import { createClient } from '@supabase/supabase-js';

// Retrieve Supabase config from Vite env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are set (not empty or containing placeholder text)
const isConfigured = 
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'YOUR_SUPABASE_URL' && 
    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const isDemoMode = !isConfigured;

// Initialize actual Supabase client if configured, otherwise export null
export const supabase = isConfigured 
    ? createClient(supabaseUrl, supabaseAnonKey) 
    : null;

if (isDemoMode) {
    console.warn("⚠️ CircleLink: Supabase keys are not set. Running in Demo Fallback Mode (using localStorage).");
} else {
    console.log("⚡ CircleLink: Supabase connected successfully!");
}

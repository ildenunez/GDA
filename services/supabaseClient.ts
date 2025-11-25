import { createClient } from '@supabase/supabase-js';

// Use standard Vite env vars for Vercel deployment, fallback to hardcoded for local sandbox if envs missing
// Cast to any to avoid "Property 'env' does not exist on type 'ImportMeta'" TS error
const env = (import.meta as any).env;

const supabaseUrl = env?.VITE_SUPABASE_URL || 'https://gwrlvrosrzxvegvcvoan.supabase.co';
const supabaseKey = env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cmx2cm9zcnp4dmVndmN2b2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjQ3NDUsImV4cCI6MjA3OTMwMDc0NX0.PbzusjnPXPSnpq-7ksFDdCxZ9YYnnBrXQRyegqQqlzE';

export const supabase = createClient(supabaseUrl, supabaseKey);
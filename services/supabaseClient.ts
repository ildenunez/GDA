
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gwrlvrosrzxvegvcvoan.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cmx2cm9zcnp4dmVndmN2b2FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MjQ3NDUsImV4cCI6MjA3OTMwMDc0NX0.PbzusjnPXPSnpq-7ksFDdCxZ9YYnnBrXQRyegqQqlzE';

export const supabase = createClient(supabaseUrl, supabaseKey);

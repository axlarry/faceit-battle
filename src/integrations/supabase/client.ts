// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://rwizxoeyatdtggrpnpmq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aXp4b2V5YXRkdGdncnBucG1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2OTkwOTYsImV4cCI6MjA2NDI3NTA5Nn0.6Rpmb1a2iFqw2VZaHl-k-3otQlQuDpaxUPf28uOlLRU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
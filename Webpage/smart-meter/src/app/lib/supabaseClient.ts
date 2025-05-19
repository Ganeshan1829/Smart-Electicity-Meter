import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'Supabase Url';
const supabaseKey = 'Supabase Key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Default export
export default supabase;

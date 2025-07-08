
import { createClient } from '@supabase/supabase-js';

const supabaseUrl ="https://cdfixospuyzncqiczijl.supabase.co";
const supabaseAnonKey = import.meta.env.REACT_APP_VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
        
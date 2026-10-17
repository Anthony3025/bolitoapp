import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tgonjixsyplqxqhnnoev.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb25qaXhzeXBscXhxaG5ub2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDIwMTEsImV4cCI6MjA4NDU3ODAxMX0.CWnemsFvqFLsK-ODfrJ1BypwQUryOd2PwKylFbkY4rM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: false, // DESACTIVADO TEMPORALMENTE para ignorar token corrupto
        detectSessionInUrl: false,
    },
});

import { createClient } from '@supabase/supabase-js';

// **¡Reemplaza con tus claves!**
const supabaseUrl = 'https://vjhddxrdywcxmqrsfefw.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqaGRkeHJkeXdjeG1xcnNmZWZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5Mjc0NDQsImV4cCI6MjA3NzUwMzQ0NH0.f8MRS5LpfjJNw5Ws9PY6cFfUr3wkIdNDS8JfqxqB6Bo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    // Esto es útil para almacenamiento local si usas autenticación,
    // pero no es estrictamente necesario solo para la base de datos pública.
    auth: {
        storage: null, 
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    }
});
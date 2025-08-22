import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = "Supabase URL and Anon Key must be defined in environment variables. Please check your .env file or Vercel environment variables.";
  
  // Display error on the page for easier debugging during development/deployment
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 2rem; text-align: center; color: red; font-family: sans-serif;">
      <h2>Konfigurasi Error</h2>
      <p>${errorMsg}</p>
      <p>Pastikan variabel <strong>VITE_SUPABASE_URL</strong> dan <strong>VITE_SUPABASE_ANON_KEY</strong> telah diatur dengan benar.</p>
    </div>`;
  }
  
  throw new Error(errorMsg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
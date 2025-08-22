// This file provides type definitions for Vite's `import.meta.env`.
// The original `/// <reference types="vite/client" />` was removed
// to resolve a "Cannot find type definition file" error.
// The interfaces below manually define the environment variables used in the application.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SCHOOL_NAME?: string;
  readonly VITE_SCHOOL_SHORT_NAME?: string;
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

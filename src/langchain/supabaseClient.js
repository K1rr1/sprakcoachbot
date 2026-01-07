import {createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !anon) {
        throw new Error("Saknar VITE_SUPABASE_URL eller VITE_SUPABASE_ANON_KEY i miljövariablerna");
    }
    return createClient(url, anon);
}

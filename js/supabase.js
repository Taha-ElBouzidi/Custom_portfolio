import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const getEnv = (key) => {
    if (typeof window !== "undefined") {
        if (window.env && window.env[key]) return window.env[key];
        if (window[key]) return window[key];
        const meta = document.querySelector(`meta[name="${key.toLowerCase()}"]`);
        if (meta && meta.content) return meta.content;
    }
    if (typeof process !== "undefined" && process.env && process.env[key]) {
        return process.env[key];
    }
    return null;
};

const SUPABASE_URL = getEnv("SUPABASE_URL") || "https://ghykglfgbbcvctnaeakp.supabase.co"; // TODO: replace with your Supabase URL
const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeWtnbGZnYmJjdmN0bmFlYWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjU1OTksImV4cCI6MjA3ODAwMTU5OX0.ZaFY-sdtComkV0dEvO6axkADyNUlNN6-kb0a9fzX75M"; // TODO: replace with your public anon key

if (SUPABASE_URL.startsWith("https://ghykglfgbbcvctnaeakp.supabase.co") || SUPABASE_ANON_KEY === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeWtnbGZnYmJjdmN0bmFlYWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjU1OTksImV4cCI6MjA3ODAwMTU5OX0.ZaFY-sdtComkV0dEvO6axkADyNUlNN6-kb0a9fzX75M") {
    console.warn("Supabase credentials are placeholders. Update js/supabase.js or provide runtime values via window.env.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

export const requireAuth = async () => {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session;
};

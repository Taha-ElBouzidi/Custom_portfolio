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

const SUPABASE_URL = getEnv("SUPABASE_URL") || "https://your-project.supabase.co"; // TODO: replace with your Supabase URL
const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY") || "your-public-anon-key"; // TODO: replace with your public anon key

if (SUPABASE_URL.startsWith("https://your-project") || SUPABASE_ANON_KEY === "your-public-anon-key") {
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

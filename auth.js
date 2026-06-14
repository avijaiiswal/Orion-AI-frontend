// ═══════════════════════════════════════════
//  ORION HUB — auth.js
//  Supabase Auth (magic link) — shared by index.html and admin.html
// ═══════════════════════════════════════════

// ── CONFIG: fill these in with your Supabase project values ──
// Find these in Supabase Dashboard > Project Settings > API
const SUPABASE_URL      = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKEND = "https://orion-ai-backend.vercel.app/api/analyze";

// ── SEND MAGIC LINK ───────────────────────────────────
async function sendMagicLink(email) {
    const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: window.location.href.split('?')[0].split('#')[0]
        }
    });
    if (error) throw error;
}

// ── GET CURRENT SESSION ───────────────────────────────
async function getSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) return null;
    return data?.session || null;
}

// ── SIGN OUT ──────────────────────────────────────────
async function signOutUser() {
    await supabaseClient.auth.signOut();
}

// ── AUTHENTICATED FETCH HELPER ────────────────────────
// Adds the verified Supabase access token to the Authorization header.
async function authedFetch(url, options = {}) {
    const session = await getSession();
    const headers = {
        ...(options.headers || {}),
        "Authorization": session ? `Bearer ${session.access_token}` : ""
    };
    return fetch(url, { ...options, headers });
}

// ── SYNC USER WITH BACKEND ────────────────────────────
// Call this after a session exists (login or page load with active session).
async function syncUserWithBackend() {
    const res = await authedFetch(`${BACKEND}?action=sync-user`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({})
    });
    const result = await res.json();
    if (!result.success) {
        throw new Error(result.error || "Sync failed.");
    }
    return result.user;
}

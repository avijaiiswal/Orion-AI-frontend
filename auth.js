// ═══════════════════════════════════════════
//  ORION HUB — auth.js
//  Supabase Auth (magic link) — shared by index.html and admin.html
// ═══════════════════════════════════════════

// ── CONFIG: fill these in with your Supabase project values ──
// Find these in Supabase Dashboard > Project Settings > API
const SUPABASE_URL      = "https://zdrmahoktloufigsmptx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_AGJaamf_G2JUdrco86c2ZQ_yo8nsZ9B";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKEND = "https://orion-ai-backend.vercel.app/api/analyze";

// ── SEND EMAIL VERIFICATION CODE ──────────────────────
// Sends a 6-digit OTP code to the user's email (NOT a magic link).
// NOTE: In Supabase Dashboard > Authentication > Email Templates >
// "Magic Link", the template must reference {{ .Token }} (the 6-digit
// code) rather than {{ .ConfirmationURL }}, or the email will still
// show a clickable link instead of a code.
// captchaToken comes from the Cloudflare Turnstile widget on the page.
async function sendOtpCode(email, captchaToken) {
    const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
            captchaToken
        }
    });
    if (error) throw error;
}

// ── VERIFY EMAIL CODE ─────────────────────────────────
// Exchanges the 6-digit code the user typed in for a real session.
// On success, Supabase fires the onAuthStateChange("SIGNED_IN", ...)
// listener automatically — no extra wiring needed.
async function verifyOtpCode(email, token) {
    const { data, error } = await supabaseClient.auth.verifyOtp({
        email,
        token,
        type: "email"
    });
    if (error) throw error;
    return data;
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

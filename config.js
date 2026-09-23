// ══════════════════════════════════════════
// CONFIG — Supabase + API
// ══════════════════════════════════════════

const SB_URL = 'https://rtdnpynbjcvemrzesslp.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZG5weW5iamN2ZW1yemVzc2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTM5NTgsImV4cCI6MjA5NTUyOTk1OH0.q3q_6Rb702dDpoF8mIAbiyDPlh5BPTnE487opTuXyjk';

// 🛠️ ADMIN PANEL — shown in the Teachers & Access table of the admin panel.
// Replace this with the real admin/owner email (used for display only).
const ADMIN_EMAIL = 'admin@aaosamjho.ai'; // TODO: replace with your real admin email

// ⚠️ SECURITY: Admin credentials are NO LONGER hardcoded here.
// Admin login is now verified via Supabase 'admins' table server-side.
// To set up: create an 'admins' table in Supabase with columns: email, pass_hash
// and enable Row Level Security (RLS) with appropriate policies.
// 
// IMPORTANT: Enable RLS on your 'students' table in Supabase immediately:
//   1. Go to Supabase Dashboard → Table Editor → students → RLS
//   2. Enable RLS
//   3. Add policy: users can only read their own row (auth.uid() = id)

// Supabase helpers
async function sb(table, method = 'GET', body = null, filter = '') {
  const url = `${SB_URL}/rest/v1/${table}${filter}`;
  const opts = {
    method,
    headers: {
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : ''
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(await r.text());
  return method === 'DELETE' ? null : r.json();
}
async function sbGet(table, filter = '') { return sb(table, 'GET', null, filter); }
async function sbPost(table, body) { return sb(table, 'POST', body); }
async function sbPatch(table, body, filter) { return sb(table, 'PATCH', body, filter); }
async function sbDelete(table, filter) { return sb(table, 'DELETE', null, filter); }

// API Key — Supabase → localStorage → prompt admin
async function getKey() {
  // 1. Try localStorage first (fastest, set via Admin Panel)
  const local = localStorage.getItem('aso_api_key');
  if (local && local !== 'undefined' && local.length > 10) return local;
  // 2. Try Supabase settings table
  try {
    const rows = await sbGet('settings', '?key=eq.api_key&select=value&limit=1');
    if (rows && rows[0] && rows[0].value) {
      localStorage.setItem('aso_api_key', rows[0].value);
      return rows[0].value;
    }
  } catch (e) {}
  return null; // No key found — callers handle this gracefully
}

// Rate limiting — prevents brute force login attempts
const _rateLimits = {};
function checkRateLimit(action, maxAttempts = 5, windowMs = 60000) {
  const now = Date.now();
  const key = `rl_${action}`;
  if (!_rateLimits[key]) _rateLimits[key] = [];
  // Remove old attempts outside the window
  _rateLimits[key] = _rateLimits[key].filter(t => now - t < windowMs);
  if (_rateLimits[key].length >= maxAttempts) {
    const wait = Math.ceil((windowMs - (now - _rateLimits[key][0])) / 1000);
    showToast('⏳', `Bahut zyada attempts! ${wait}s baad try karo`);
    return false;
  }
  _rateLimits[key].push(now);
  return true;
}

// ══════════════════════════════════════════
// SYLLABUS DATA
// ══════════════════════════════════════════

const DEFAULT_SUBJECTS = {
  cbse: {
    9: [
      { id: 'math9',  name: 'Mathematics',   emoji: '🔢', color: '#22c55e' },
      { id: 'phy9',   name: 'Physics',        emoji: '⚡', color: '#4f8ef7' },
      { id: 'chem9',  name: 'Chemistry',      emoji: '🧪', color: '#06b6d4' },
      { id: 'bio9',   name: 'Biology',        emoji: '🧬', color: '#22c55e' },
      { id: 'eng9',   name: 'English',        emoji: '📚', color: '#eab308' },
      { id: 'hin9',   name: 'Hindi',          emoji: '✍️', color: '#a78bfa' },
      { id: 'sst9',   name: 'Social Science', emoji: '🌍', color: '#f97316' }
    ],
    10: [
      { id: 'math10', name: 'Mathematics',   emoji: '🔢', color: '#22c55e' },
      { id: 'sci10',  name: 'Science',        emoji: '🔬', color: '#4f8ef7' },
      { id: 'eng10',  name: 'English',        emoji: '📚', color: '#eab308' },
      { id: 'hin10',  name: 'Hindi',          emoji: '✍️', color: '#a78bfa' },
      { id: 'sst10',  name: 'Social Science', emoji: '🌍', color: '#f97316' }
    ]
  },
  state: {
    9:  [{ id: 'st9',  name: 'Coming Soon', emoji: '🗺️', color: '#94a3b8' }],
    10: [{ id: 'st10', name: 'Coming Soon', emoji: '🗺️', color: '#94a3b8' }]
  }
};

// FIX: getSubjects()/saveSubjects() used to be localStorage-only — an admin
// adding a chapter only ever saw it in their own browser, never synced to
// students. Now backed by a shared Supabase table ("subjects"), with the
// local copy kept only as an offline-read fallback, not the source of truth.
// Requires the "subjects" table — see subjects_table_migration.sql.
async function getSubjects(board, cls) {
  try {
    const rows = await sbGet('subjects', `?board=eq.${board}&cls=eq.${cls}&order=sort_order.asc`);
    if (rows && rows.length) {
      const mapped = rows.map(r => ({ id: r.subj_id, name: r.name, emoji: r.emoji, color: r.color, chapters: r.chapters || [] }));
      localStorage.setItem('aso_subjects_' + board + '_' + cls, JSON.stringify(mapped)); // offline cache only
      return mapped;
    }
  } catch (e) {
    console.warn('[Subjects] Supabase unreachable, using local cache/defaults:', e.message);
  }
  // Fallback (offline / Supabase down / table not migrated yet)
  const key = 'aso_subjects_' + board + '_' + cls;
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);
  const defaults = DEFAULT_SUBJECTS[board]?.[cls] || [];
  return defaults.map(s => ({ ...s, chapters: [] }));
}

// Upserts the full subject list for a board+class to Supabase in one
// request (matched on board+cls+subj_id), and mirrors to localStorage as
// an offline cache. Throws if the Supabase sync fails so callers can warn
// the admin that the change may not have actually gone out to students.
async function saveSubjects(board, cls, subjects) {
  localStorage.setItem('aso_subjects_' + board + '_' + cls, JSON.stringify(subjects)); // offline cache
  const rows = subjects.map((s, i) => ({
    board, cls, subj_id: s.id, name: s.name, emoji: s.emoji, color: s.color,
    chapters: s.chapters || [], sort_order: i
  }));
  const url = `${SB_URL}/rest/v1/subjects?on_conflict=board,cls,subj_id`;
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal'
    },
    body: JSON.stringify(rows)
  });
  if (!r.ok) throw new Error(await r.text());
}

// Markdown renderer (simple — used for AI responses)
function md(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4 style="margin:10px 0 4px;font-size:0.9rem">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 style="margin:10px 0 4px;font-size:0.95rem">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 style="margin:10px 0 6px;font-size:1rem">$1</h2>')
    .replace(/^• (.+)$/gm, '<li style="margin:3px 0">$1</li>')
    .replace(/^- (.+)$/gm, '<li style="margin:3px 0">$1</li>')
    .replace(/(<li.*<\/li>)/s, '<ul style="padding-left:16px;margin:6px 0">$1</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

// Toast notification (shared, defined early so auth.js can use it)
let _tTo;
function showToast(icon, msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('ti').textContent = icon;
  document.getElementById('tm').textContent = msg;
  t.style.display = 'block';
  clearTimeout(_tTo);
  _tTo = setTimeout(() => { t.style.display = 'none'; }, 2800);
}

function closeM(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open'), el.style.display = 'none';
}

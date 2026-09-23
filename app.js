// ════════════════════════════════════════
// AAO SAMJHO AI — APP.JS
// Navigation, rendering, UI helpers
// ════════════════════════════════════════

// ════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════

function initApp() {
  // Load theme
  const savedTheme = localStorage.getItem('aso-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton();

  // Resize: close sidebar on desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      document.getElementById('sidebar').style.transform = 'translateX(-100%)';
    }
  });

  // Close sidebar when clicking outside
  document.getElementById('app').addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const mobBtn  = document.getElementById('mob-btn');
    if (!sidebar.contains(e.target) && e.target !== mobBtn) {
      sidebar.style.transform = 'translateX(-100%)';
    }
  });

  // Render home page
  renderHome();
  renderSubjects();
  updateStats();
  renderBroadcast();

  // Show Admin nav item only for admin/teacher accounts
  const navAdmin = document.getElementById('nav-admin');
  if (navAdmin) navAdmin.style.display = (CU?.role === 'admin' || CU?.role === 'teacher') ? 'flex' : 'none';

  nav('home');

  // FIX: manifest.json declares "AI Tutor" (/#ai) and "Subjects" (/#subjects)
  // as installed-PWA shortcuts, but nothing ever read location.hash to route
  // there — they always just opened the home page. Now they do.
  const hash = (location.hash || '').replace('#', '');
  if (hash === 'ai') nav('ai');
  else if (hash === 'subjects') nav('subjects');

  if (typeof initServiceWorker !== 'undefined') initServiceWorker();
}

// Opens the standalone admin panel (admin.html) in a new tab — guarded so
// only admin/teacher accounts see the sidebar link at all. The admin panel
// used to be a page inside this app (pg-admin / admin.js); it's now fully
// separate with its own auth, so it can be deployed independently if needed.
function openAdmin(){
  if (!CU || (CU.role !== 'admin' && CU.role !== 'teacher')) { showToast('❌', 'Access denied'); return; }
  window.open('admin.html', '_blank');
}

function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('✅ SW registered'))
      .catch(e => console.log('⚠️ SW error:', e));
  }
}

// ════════════════════════════════════════
// THEME
// ════════════════════════════════════════

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('aso-theme', next);
  updateThemeButton();
  showToast('✅', next === 'light' ? '☀️ Light mode' : '🌙 Dark mode');
}

function updateThemeButton() {
  const btn = document.getElementById('theme-btn');
  if (!btn) return;
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════

function nav(p) {
  document.querySelectorAll('.page').forEach(pg => pg.style.display = 'none');
  const pageEl = document.getElementById(`pg-${p}`);
  if (pageEl) pageEl.style.display = 'block';

  document.querySelectorAll('[data-n]').forEach(el => {
    const isActive = el.dataset.n === p;
    el.classList.toggle('active', isActive);
    el.style.background = isActive ? 'rgba(79,142,247,0.15)' : '';
    el.style.color = isActive ? '#f0f4ff' : '#8899bb';
  });

  if (window.innerWidth < 768) {
    document.getElementById('sidebar').style.transform = 'translateX(-100%)';
  }
}

// ════════════════════════════════════════
// HOME PAGE
// ════════════════════════════════════════

async function renderHome() {
  if (!CU) return;
  const name = CU.name?.split(' ')[0] || 'Student';
  document.getElementById('hname').innerHTML = `${name}, <span style="background:linear-gradient(135deg,#4f8ef7,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Shuru Karo!</span>`;
  document.getElementById('hinfo').textContent = `${(BOARD || 'cbse').toUpperCase()} • Class ${CLASS || 9}`;
  document.getElementById('hsgrid').innerHTML = '<div style="color:#8899bb;text-align:center;padding:20px;grid-column:1/-1">⏳ Loading...</div>';

  const subjects = await getSubjects(BOARD, CLASS);
  let html = '';
  subjects.forEach((s, i) => {
    const chapters = s.chapters || [];
    const done = JSON.parse(localStorage.getItem(`pd_${s.id}`) || '[]');
    const pct = chapters.length > 0 ? Math.round((done.length / chapters.length) * 100) : 0;
    html += `
      <div class="scard" onclick="openSubj('${s.id}')">
        <div class="scard-top" style="background:${s.color}"></div>
        <span class="semoji">${s.emoji}</span>
        <div class="sn">${s.name}</div>
        <div class="sch">${chapters.length} chapters</div>
        <div class="sbar"><div class="sbf" style="width:${pct}%;background:${s.color}"></div></div>
      </div>
    `;
  });
  document.getElementById('hsgrid').innerHTML = html;
}

// FIX: pairs with admin.js's broadcast() — shows the latest broadcast (if
// any, and if not already dismissed / older than 7 days) as a banner on
// the student home page.
async function renderBroadcast() {
  const el = document.getElementById('bc-banner');
  if (!el) return;
  let b = null;
  try {
    const rows = await sbGet('broadcasts', '?order=sent_at.desc&limit=1');
    b = rows?.[0];
  } catch (e) {
    const all = JSON.parse(localStorage.getItem('aso_broadcasts') || '[]');
    b = all[0];
  }
  if (!b) { el.style.display = 'none'; return; }

  const key = 'bc_dismissed_' + (b.sent_at || b.subject);
  if (localStorage.getItem(key)) { el.style.display = 'none'; return; }

  const ageMs = Date.now() - new Date(b.sent_at).getTime();
  if (isNaN(ageMs) || ageMs > 7 * 24 * 60 * 60 * 1000) { el.style.display = 'none'; return; }

  el.style.display = 'block';
  el.innerHTML = `
    <div style="background:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.3);border-radius:12px;padding:12px 14px;margin-bottom:16px;display:flex;gap:10px;align-items:flex-start">
      <div style="font-size:1.2rem">📢</div>
      <div style="flex:1">
        <div style="font-size:0.85rem;font-weight:700;margin-bottom:2px">${escapeHtml(b.subject)}</div>
        <div style="font-size:0.78rem;color:#b0c0d8">${escapeHtml(b.message)}</div>
      </div>
      <div onclick="localStorage.setItem('${key}','1');document.getElementById('bc-banner').style.display='none'" style="cursor:pointer;color:#8899bb;font-size:0.9rem">✕</div>
    </div>`;
}

// FIX: Use real data from localStorage instead of Math.random()
async function updateStats() {
  if (!CU) return;
  const userKey = CU.email || CU.id || 'guest';

  // Count tests done
  const testsDone = parseInt(localStorage.getItem(`tests_${userKey}`) || '0');

  // Count chapters done across all subjects
  const subjects = await getSubjects(BOARD, CLASS);
  let chapsDone = 0;
  subjects.forEach(s => {
    const done = JSON.parse(localStorage.getItem(`pd_${s.id}`) || '[]');
    chapsDone += done.length;
  });

  // Streak: count consecutive days with activity
  const streak = calcStreak(userKey);

  document.getElementById('hc').textContent  = chapsDone;
  document.getElementById('ht').textContent  = testsDone;
  document.getElementById('hstrk').textContent = streak + '🔥';
}

function calcStreak(userKey) {
  try {
    const raw = localStorage.getItem(`streak_${userKey}`);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    // data.days = array of date strings 'YYYY-MM-DD'
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (!data.days.includes(today) && !data.days.includes(yesterday)) return 0;
    // Count consecutive days back from today
    let streak = 0;
    let d = new Date();
    while (true) {
      const ds = d.toISOString().split('T')[0];
      if (data.days.includes(ds)) { streak++; d = new Date(d - 86400000); }
      else break;
    }
    return streak;
  } catch (e) { return 0; }
}

// Call this whenever user does an activity (test, notes read, etc.)
function recordActivity() {
  if (!CU) return;
  const userKey = CU.email || CU.id || 'guest';
  const today = new Date().toISOString().split('T')[0];
  const raw = localStorage.getItem(`streak_${userKey}`);
  let data = raw ? JSON.parse(raw) : { days: [] };
  if (!data.days.includes(today)) {
    data.days.push(today);
    // Keep only last 365 days
    data.days = data.days.slice(-365);
    localStorage.setItem(`streak_${userKey}`, JSON.stringify(data));
  }
}

// ════════════════════════════════════════
// SUBJECTS PAGE
// ════════════════════════════════════════

async function renderSubjects() {
  document.getElementById('sublist').innerHTML = '<div style="color:#8899bb;text-align:center;padding:32px;">⏳ Loading...</div>';
  const subjects = await getSubjects(BOARD, CLASS);
  let html = '';
  subjects.forEach((s, i) => {
    const chapters = s.chapters || [];
    html += `
      <div class="sli" onclick="openSubj('${s.id}')">
        <div class="slic" style="background:${s.color}15;color:${s.color}">${s.emoji}</div>
        <div class="slii">
          <div class="slin">${s.name}</div>
          <div class="slis">${chapters.length} chapters</div>
        </div>
        <div style="color:#8899bb">›</div>
      </div>
    `;
  });
  document.getElementById('sublist').innerHTML = html || '<div style="color:#8899bb;text-align:center;padding:32px;">Koi subjects nahi — Admin se contact karo</div>';
}

// ════════════════════════════════════════
// CHAPTERS
// ════════════════════════════════════════

async function openSubj(sid) {
  const subjects = await getSubjects(BOARD, CLASS);
  curSubj = subjects.find(s => s.id === sid);
  if (!curSubj) { showToast('❌', 'Subject nahi mila'); return; }

  document.getElementById('ch-tag').textContent = `${(BOARD || 'cbse').toUpperCase()} • Class ${CLASS}`;
  document.getElementById('ch-name').textContent = `${curSubj.emoji} ${curSubj.name}`;

  const chapters = curSubj.chapters || [];
  const done = JSON.parse(localStorage.getItem(`pd_${sid}`) || '[]');

  let html = '';
  if (chapters.length === 0) {
    html = `<div style="color:#8899bb;text-align:center;padding:32px;background:#111827;border:1px solid #2d5a8a;border-radius:14px;">
      <div style="font-size:2rem;margin-bottom:8px">📖</div>
      <p>Chapters abhi add nahi hue — Admin jald upload karega!</p>
    </div>`;
  } else {
    chapters.forEach((c, i) => {
      const isDone = done.includes(i);
      html += `
        <div class="chi" onclick="openChap('${sid}', ${i})">
          <div class="chin" style="background:${curSubj.color}15;color:${curSubj.color}">${i + 1}</div>
          <div class="chit">${typeof c === 'string' ? c : c.name}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${isDone ? '<span style="font-size:0.7rem;color:#22c55e;background:rgba(34,197,94,0.1);padding:2px 8px;border-radius:6px;">✓ Done</span>' : ''}
            <div class="chia">›</div>
          </div>
        </div>
      `;
    });
  }
  document.getElementById('chlist').innerHTML = html;
  nav('chapters');
}

async function openChap(sid, idx) {
  const subjects = await getSubjects(BOARD, CLASS);
  curSubj = subjects.find(s => s.id === sid) || curSubj;
  const chapters = curSubj?.chapters || [];
  const chapName = typeof chapters[idx] === 'string' ? chapters[idx] : chapters[idx]?.name || `Chapter ${idx + 1}`;

  curChap = { idx, name: chapName };
  document.getElementById('det-title').textContent = `📚 ${chapName}`;
  trackEvent('open_chapter', 'content', curSubj?.name + ' - ' + chapName);

  // Reset to Videos tab
  swFlow(document.querySelectorAll('.ftab')[0], 'fv');
  renderVideos();
  renderNotes();
  setupAI();
  renderTest();
  recordActivity();
  nav('detail');
}

// ════════════════════════════════════════
// VIDEOS
// ════════════════════════════════════════

function renderVideos() {
  const vKey = `vids_${curSubj?.id}_${curChap?.idx}`;
  const videos = JSON.parse(localStorage.getItem(vKey) || '[]');
  const isAd = CU?.role === 'admin' || CU?.role === 'teacher';

  let html = '';
  if (isAd) html += `<button class="vaddb" onclick="addVideo()">+ Video Add Karo</button>`;

  if (videos.length === 0) {
    html += `<div style="text-align:center;padding:32px;background:#111827;border:1px solid #2d5a8a;border-radius:14px;">
      <div style="font-size:2rem;margin-bottom:8px">🎬</div>
      <p style="color:#8899bb">Videos jald upload honge!<br>Abhi AI Doubt tab try karo 🤖</p>
    </div>`;
  } else {
    html += '<div class="vlist">';
    videos.forEach((v, i) => {
      html += `
        <div class="vi" onclick="playVideo('${v.url}')">
          <div class="vith" style="background:rgba(79,142,247,0.1)">🎬</div>
          <div style="flex:1;min-width:0">
            <div class="vit">${v.title}</div>
            <div class="vim">${v.duration || ''} • Tap to watch</div>
            <div class="vaib" onclick="event.stopPropagation();askAI('${v.title}')">🤖 AI se poochho</div>
          </div>
          <div class="vpc">▶</div>
        </div>
      `;
    });
    html += '</div>';
  }
  document.getElementById('fv').innerHTML = html;
}

function playVideo(url) {
  if (url && url !== 'undefined') window.open(url, '_blank');
  else showToast('ℹ️', 'Video URL set nahi hai');
}

function addVideo() {
  const title = prompt('Video ka title:');
  if (!title) return;
  const url      = prompt('YouTube URL:') || '';
  const duration = prompt('Duration (e.g. 15 min):') || '';
  const vKey = `vids_${curSubj?.id}_${curChap?.idx}`;
  const vids = JSON.parse(localStorage.getItem(vKey) || '[]');
  vids.push({ title, url, duration });
  localStorage.setItem(vKey, JSON.stringify(vids));
  showToast('✅', 'Video add ho gaya!');
  renderVideos();
}

// ════════════════════════════════════════
// NOTES
// ════════════════════════════════════════

async function renderNotes() {
  const isAd = CU?.role === 'admin' || CU?.role === 'teacher';
  let note = null;

  try {
    const r = await sbGet('notes', `?subject_id=eq.${curSubj.id}&chapter_idx=eq.${curChap.idx}&limit=1`);
    note = r?.[0];
  } catch (e) {
    note = JSON.parse(localStorage.getItem(`note_${curSubj.id}_${curChap.idx}`) || 'null');
  }

  let h = '';
  if (isAd) {
    h += `<div style="display:flex;gap:7px;margin-bottom:10px;flex-wrap:wrap">
      <button class="nbtn p" onclick="addNote()">+ Note/PDF Add</button>
      <button class="nbtn" style="color:#22c55e;border-color:rgba(34,197,94,0.3)" onclick="genNotes()">🤖 AI se Generate</button>
    </div>`;
  }

  if (!note) {
    h += `<div class="nblock">
      <h3>📖 ${curChap.name}</h3>
      <p>Notes jald upload honge!</p>
      <p>Abhi <strong>AI Doubt</strong> tab pe jaao — AI detail mein samjhayega!</p>
      <div class="nacts">
        <div class="nbtn p" onclick="swFlow(document.querySelectorAll('.ftab')[2],'fa')">🤖 AI se Poochho</div>
      </div>
    </div>`;
  } else {
    h += `<div class="nblock">
      <h3>📝 ${note.title || curChap.name}</h3>
      <div style="font-size:0.86rem;line-height:1.7;color:#b0c0d8">${note.content || ''}</div>
      <div class="nacts">
        <div class="nbtn" onclick="dlNote()">⬇ Download</div>
        <div class="nbtn p" onclick="swFlow(document.querySelectorAll('.ftab')[2],'fa')">🤖 Doubt Poochho</div>
        ${note.url ? `<div class="nbtn" onclick="window.open('${note.url}','_blank')">📄 PDF</div>` : ''}
      </div>
    </div>`;
  }
  document.getElementById('fn').innerHTML = h;
}

async function addNote() {
  const title = prompt('Note ka title:');
  if (!title) return;
  const url = prompt('PDF/Drive URL (optional):') || '';
  const n = { subject_id: curSubj.id, chapter_idx: curChap.idx, title, url, content: `<p>${title}</p>`, added_by: CU.name };
  try { await sbPost('notes', n); } catch (e) {
    localStorage.setItem(`note_${curSubj.id}_${curChap.idx}`, JSON.stringify(n));
  }
  showToast('✅', 'Note add ho gaya!');
  renderNotes();
}

async function genNotes() {
  showToast('⏳', 'AI notes bana raha hai...');
  try {
    // FIX: was a hardcoded Gemini-only fetch, ignoring whatever provider
    // the saved key actually was for (OpenAI/Groq/Claude/OpenRouter keys
    // would silently fail here). Now goes through the same backend-first,
    // multi-provider path as every other AI feature in the app.
    const sys = `Tu expert ${curSubj.name} teacher hai. Class ${CLASS} CBSE ke liye Hinglish mein comprehensive notes banao. HTML format: <h3> headings, <p> text, <ul><li> points. Student-friendly.`;
    const content = await getAIReply(sys, [{ role: 'user', content: `"${curChap.name}" ke detailed notes banao.` }]);
    const n = { subject_id: curSubj.id, chapter_idx: curChap.idx, title: curChap.name, content, url: '', added_by: 'AI' };
    try { await sbPost('notes', n); } catch (e) {
      localStorage.setItem(`note_${curSubj.id}_${curChap.idx}`, JSON.stringify(n));
    }
    showToast('✅', 'Notes ready!');
    renderNotes();
  } catch (e) { showToast('❌', e.message); }
}

function dlNote() {
  const n = JSON.parse(localStorage.getItem(`note_${curSubj.id}_${curChap.idx}`) || '{}');
  const blob = new Blob([`${curChap.name}\n\n${(n.content || '').replace(/<[^>]+>/g, '')}`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = curChap.name.replace(/\s+/g, '_') + '.txt';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('⬇️', 'Downloaded!');
}

// ════════════════════════════════════════
// AI DOUBT (in chapter)
// ════════════════════════════════════════

function setupAI() {
  dHist = [];
  document.getElementById('ai-ctx').textContent = `${curSubj?.name} — ${curChap?.name}`;
  const qs = ['Yeh chapter explain karo', 'Important formulas?', 'Exam ke liye kya zaroori?', 'Ek example do'];
  const qh = qs.map(q => `<div class="qa" onclick="sendDoubt('${q}')">${q}</div>`).join('');
  document.getElementById('ai-msgs').innerHTML = `<div class="aiemp"><div class="big">🧠</div><p>Kuch bhi poochho!<br>Hinglish mein samjhaunga 😊</p><div class="qas">${qh}</div></div>`;
}

async function sendDoubt(preset) {
  const inp = document.getElementById('di');
  const raw = preset || inp.value.trim();
  if (!raw) return;
  const q = raw.slice(0, 2000);
  if (!preset) { inp.value = ''; }
  document.getElementById('dsend').disabled = true;

  const area = document.getElementById('ai-msgs');
  area.querySelector('.aiemp')?.remove();
  addMsg(area, 'user', q);
  dHist.push({ role: 'user', content: q });

  const tid = 't' + Date.now();
  area.insertAdjacentHTML('beforeend', `<div class="trow" id="${tid}"><div class="mav">🧠</div><div class="tdots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`);
  area.scrollTop = area.scrollHeight;

  const sys = `Tu "Aao Samjho AI" hai — Class ${CLASS} ${(BOARD||'cbse').toUpperCase()} ${curSubj?.name||''} ka expert tutor. Chapter: "${curChap?.name||''}".
RULES: Sirf educational content do. Hinglish mein samjhao. Simple language, real examples. Agar question syllabus se bahar hai toh politely redirect karo.`;

  try {
    const reply = await getAIReply(sys, dHist);
    document.getElementById(tid)?.remove();
    dHist.push({ role: 'assistant', content: reply });
    // FIX: sanitize AI output before injecting as HTML
    addMsgSafe(area, 'bot', md(reply));
  } catch (e) {
    document.getElementById(tid)?.remove();
    addMsg(area, 'bot', '❌ ' + e.message);
  }
  document.getElementById('dsend').disabled = false;
}

function askAI(topic) {
  document.getElementById('di').value = `${topic} ke baare mein samjha do`;
  sendDoubt();
}

// ════════════════════════════════════════
// FULL AI PAGE
// ════════════════════════════════════════

async function sendFull(preset) {
  const inp = document.getElementById('fci');
  const q = preset || inp.value.trim();
  if (!q) return;
  if (!preset) { inp.value = ''; }
  document.getElementById('fcsend').disabled = true;

  const area = document.getElementById('fc-msgs');
  area.querySelector('.aiemp')?.remove();
  addMsg(area, 'user', q);
  fHist.push({ role: 'user', content: q });

  const tid = 't' + Date.now();
  area.insertAdjacentHTML('beforeend', `<div class="trow" id="${tid}"><div class="mav">🧠</div><div class="tdots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`);
  area.scrollTop = area.scrollHeight;

  const sys = `Tu "Aao Samjho AI" hai — Class ${CLASS} ${(BOARD||'cbse').toUpperCase()} students ke liye expert AI tutor. Hinglish mein samjhao. Sirf educational help karo. Encouraging raho.`;

  try {
    const reply = await getAIReply(sys, fHist);
    document.getElementById(tid)?.remove();
    fHist.push({ role: 'assistant', content: reply });
    addMsgSafe(area, 'bot', md(reply));
  } catch (e) {
    document.getElementById(tid)?.remove();
    addMsg(area, 'bot', '❌ Error: ' + e.message);
  }
  document.getElementById('fcsend').disabled = false;
}

function clrFull() {
  fHist = [];
  document.getElementById('fc-msgs').innerHTML = '<div class="aiemp"><div class="big">💬</div><p>Naya chat!</p></div>';
}

// ════════════════════════════════════════
// TEST
// ════════════════════════════════════════

function renderTest() {
  document.getElementById('ft').innerHTML = `
    <div class="tstart">
      <div style="font-size:2rem;margin-bottom:6px">🎯</div>
      <h3>${curChap?.name}</h3>
      <p>AI 10 fresh questions banayega is chapter se</p>
      <div class="tmrow"><div class="tm">Questions: <span>10</span></div><div class="tm">Marks: <span>40</span></div></div>
      <button class="tstbtn" onclick="startTest()">Test Shuru Karo →</button>
    </div>`;
}

async function startTest() {
  document.getElementById('ft').innerHTML = `<div style="text-align:center;padding:36px;color:#8899bb"><div style="font-size:2rem;margin-bottom:8px">⏳</div>AI questions bana raha hai...</div>`;

  const sys = `Generate exactly 10 MCQ questions for Class ${CLASS} CBSE ${curSubj.name} — "${curChap.name}". Medium difficulty. Reply ONLY with valid JSON array (no markdown, no explanation):
[{"q":"?","options":["A) ","B) ","C) ","D) "],"answer":"A","explanation":"brief in Hinglish"}]`;

  try {
    const raw = await getAIReply(sys, [{ role: 'user', content: 'Generate the questions now.' }]);
    const m = raw.match(/\[[\s\S]*\]/);
    const qs = m ? JSON.parse(m[0]) : [];
    if (!qs.length) throw new Error('Questions nahi bane — dobara try karo');
    renderTestQs(qs);

    // Record test
    const userKey = CU.email || CU.id || 'guest';
    const testKey = `tests_${userKey}`;
    localStorage.setItem(testKey, String(parseInt(localStorage.getItem(testKey) || '0') + 1));

    // Mark chapter done
    const pd = JSON.parse(localStorage.getItem(`pd_${curSubj.id}`) || '[]');
    if (!pd.includes(curChap.idx)) { pd.push(curChap.idx); localStorage.setItem(`pd_${curSubj.id}`, JSON.stringify(pd)); }

    recordActivity();
    updateStats();
    trackEvent('test_completed', 'engagement', curSubj?.name + ' - ' + curChap?.name);
  } catch (e) {
    document.getElementById('ft').innerHTML = `<div style="text-align:center;padding:28px;color:#f87171">❌ ${e.message}<br><small style="color:#8899bb">Dobara try karo</small></div>`;
  }
}

function renderTestQs(qs) {
  document.getElementById('ft').innerHTML =
    qs.map((q, i) => `<div class="tq" id="tq${i}">
      <div class="tqt">Q${i + 1}. ${q.q}</div>
      <div class="topts">${q.options.map((o, j) => {
        const l = String.fromCharCode(65 + j);
        return `<div class="topt" id="to${i}_${j}" onclick="ansQ(${i},'${l}','${q.answer}')"><div class="tolbl">${l}</div><span>${o.replace(/^[A-D]\)\s*/, '')}</span></div>`;
      }).join('')}</div>
      <div class="texp" id="te${i}">💡 ${q.explanation || ''}</div>
    </div>`).join('') +
    `<div style="text-align:center;padding:14px"><button class="tstbtn" onclick="showScore()">📊 Score Dekho</button></div>`;
}

function ansQ(qi, sel, cor) {
  const qd = document.getElementById(`tq${qi}`);
  if (qd.dataset.done) return;
  qd.dataset.done = '1'; qd.dataset.cor = sel === cor ? '1' : '0';
  for (let j = 0; j < 4; j++) {
    const el = document.getElementById(`to${qi}_${j}`);
    if (!el) continue;
    const l = String.fromCharCode(65 + j);
    el.style.pointerEvents = 'none';
    if (l === cor) el.classList.add('correct');
    else if (l === sel) el.classList.add('wrong');
  }
  document.getElementById(`te${qi}`).style.display = 'block';
}

function showScore() {
  let cor = 0;
  document.querySelectorAll('[id^="tq"]').forEach(q => { if (q.dataset.cor === '1') cor++; });
  const tot = document.querySelectorAll('[id^="tq"]').length || 10;
  const pct = Math.round((cor / tot) * 100);
  const msg = pct >= 80 ? '🎉 Bahut badhiya!' : pct >= 60 ? '👍 Acha kiya!' : pct >= 40 ? '📚 Thodi aur mehnat karo' : '💪 Haar mat mano!';
  document.getElementById('ft').innerHTML = `
    <div class="tscore">
      <div style="font-size:2rem">${pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '📚'}</div>
      <div class="tscore-big" style="color:${pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444'}">${cor}/${tot}</div>
      <div style="font-size:1.1rem;font-weight:700;margin-bottom:5px">${pct}%</div>
      <div class="tscore-msg">${msg}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
        <button class="tstbtn" onclick="startTest()" style="padding:9px 20px">🔄 Dobara Do</button>
        <button class="tstbtn" onclick="swFlow(document.querySelectorAll('.ftab')[2],'fa')" style="padding:9px 20px;background:rgba(79,142,247,0.15);border:1px solid rgba(79,142,247,0.25);color:#7eb3ff">🤖 Doubt Poochho</button>
      </div>
    </div>`;
  showToast('🎉', `Test done! Score: ${pct}%`);
}

// ════════════════════════════════════════
// UI HELPERS
// ════════════════════════════════════════

function addMsg(container, type, text) {
  container.querySelector('.aiemp')?.remove();
  const msg = document.createElement('div');
  msg.className = `msg ${type}`;
  if (type === 'bot') {
    msg.innerHTML = `<div class="mav">🧠</div><div class="bub">${escapeHtml(text)}</div>`;
  } else {
    msg.innerHTML = `<div class="bub">${escapeHtml(text)}</div>`;
  }
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

// FIX: Safe HTML injection for AI responses (uses DOMPurify if available)
function addMsgSafe(container, type, htmlContent) {
  container.querySelector('.aiemp')?.remove();
  const msg = document.createElement('div');
  msg.className = `msg ${type}`;
  const bub = document.createElement('div');
  bub.className = 'bub';
  // Use DOMPurify if loaded, otherwise strip all tags as fallback
  if (typeof DOMPurify !== 'undefined') {
    bub.innerHTML = DOMPurify.sanitize(htmlContent);
  } else {
    bub.innerHTML = htmlContent.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');
  }
  if (type === 'bot') {
    const av = document.createElement('div');
    av.className = 'mav';
    av.textContent = '🧠';
    msg.appendChild(av);
  }
  msg.appendChild(bub);
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function swFlow(el, flow) {
  document.querySelectorAll('.ftab').forEach(t => {
    t.classList.remove('active');
    t.style.background = 'none';
    t.style.color = '#8899bb';
  });
  document.querySelectorAll('.fc').forEach(f => f.style.display = 'none');
  el.classList.add('active');
  el.style.background = 'linear-gradient(135deg,#4f8ef7,#a78bfa)';
  el.style.color = '#fff';
  const fc = document.getElementById(flow);
  if (fc) fc.style.display = 'block';
}

// Analytics (optional — only fires if gtag is loaded)
function trackEvent(action, category, label) {
  if (typeof gtag !== 'undefined') {
    gtag('event', action, { event_category: category, event_label: label });
  }
}

// ═══════════════════════════════════════════
//  ORION HUB — script.js  (v3)
// ═══════════════════════════════════════════

const toolsData = {
    startup: [
        { id: "pitch",      name: "Premium Pitch Deck Builder",        multimodal: true  },
        { id: "cold_email", name: "B2B Cold Email Generator",          multimodal: false }
    ],
    creator: [
        { id: "viral_hook",  name: "🎬 Viral Hook Scripting Machine",  multimodal: false },
        { id: "thumb_audit", name: "🎨 YouTube Thumbnail Auditor",     multimodal: true  }
    ],
    marketing: [
        { id: "sponsorship", name: "🎯 Sponsorship & Brand Deal Pitcher", multimodal: false }
    ],
    ecom: [
        { id: "ecom_listing", name: "Product Listing Optimizer",       multimodal: false }
    ]
};

const TAB_TITLES = {
    startup:   "Startup Suite",
    creator:   "Creator Studio",
    marketing: "Marketing",
    ecom:      "E-Commerce"
};

// NOTE: client-side admin list is for DISPLAY ONLY.
// Real admin verification is done server-side via Supabase Auth token.
const ORION_ADMINS = [
    "avijaiswal10052009@gmail.com",
    "Anonymousperson1508@gmail.com"
];

const PLAN_TIERS = {
    free:    { name: "Free",    sub: "Your current plan" },
    weekly:  { name: "Weekly",  sub: "Active subscription" },
    monthly: { name: "Monthly", sub: "Active subscription" },
    yearly:  { name: "Yearly",  sub: "Active subscription" },
    ultimate:{ name: "Yearly",  sub: "Active subscription" },
    admin:   { name: "Admin",   sub: "Unlimited access" }
};

let currentTab  = "startup";
let userProfile = { email: "", status: "free", trialsLeft: 5 };

// Local session history (stored in-memory; clears on page reload)
let sessionHistory = [];

// ── INIT ──────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
    if (document.getElementById("toolSelector")) {
        switchTab("startup");
    }
    await checkExistingSession();
});

supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
        await onLoggedIn();
    } else if (event === "SIGNED_OUT") {
        userProfile = { email: "", status: "free", trialsLeft: 5 };
        document.getElementById("loginWall")?.classList.remove("hidden");
        document.getElementById("loginWall")?.classList.add("visible");
        document.getElementById("userBadge")?.classList.add("hidden");
        updatePlanChip();
    }
});

async function checkExistingSession() {
    const session = await getSession();
    if (session) {
        await onLoggedIn();
    } else {
        document.getElementById("loginWall")?.classList.add("visible");
    }
}

async function onLoggedIn() {
    try {
        const user = await syncUserWithBackend();
        userProfile = {
            email:      user.email,
            status:     user.status,
            trialsLeft: user.trials_left
        };
        document.getElementById("loginWall")?.classList.remove("visible");
        document.getElementById("loginWall")?.classList.add("hidden");
        updateClientBadge();
        updatePlanChip();
        updateGreetingName();
        showToast("Access active. Security layers validated. 🔥");
    } catch (e) {
        showToast(e.message || "Could not sync your account. Try logging in again.");
    }
}

// ── GREETING ──────────────────────────────────────────
function updateGreetingName() {
    const sub = document.getElementById("greetingSub");
    const el  = document.getElementById("greetingLine");
    if (!sub || !userProfile.email) return;
    // Capitalize every word of name from email
    const name = userProfile.email.split("@")[0].replace(/[._]/g, " ");
    const capitalized = name.replace(/\b\w/g, c => c.toUpperCase());
    const h = new Date().getHours();
    let sub_text = "welcome back";
    if (h >= 5  && h < 8)  sub_text = "rise and shine";
    else if (h >= 8  && h < 12) sub_text = "hope the day's off to a great start";
    else if (h >= 12 && h < 17) sub_text = "hope your day is going well";
    else if (h >= 17 && h < 19) sub_text = "what a sky out there";
    else if (h >= 19 && h < 21) sub_text = "winding down nicely";
    else sub_text = "burning the midnight oil";

    sub.textContent = `${capitalized} · ${sub_text}`;
    // Color is controlled by CSS (.greeting-sub) — do not override here
}

// ── AUTH ──────────────────────────────────────────────
async function triggerDirectLogin() {
    const inputEmail = document.getElementById("userDirectEmail").value.trim();
    if (!inputEmail || !inputEmail.includes("@")) {
        showToast("Valid email address required.");
        return;
    }
    const btn = document.getElementById("loginBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending…`; }
    try {
        await sendMagicLink(inputEmail);
        showToast(`Magic link sent to ${inputEmail}. Check your inbox.`);
        document.getElementById("loginStatusMsg")?.classList.remove("hidden");
    } catch (e) {
        showToast(e.message || "Could not send login link. Try again.");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send Magic Link`; }
    }
}

async function logoutUser() {
    await signOutUser();
    location.reload();
}

// ── NAVIGATION ────────────────────────────────────────
function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll(".nav-icon-btn[data-tab]").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.querySelector(`.nav-icon-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    const title = document.getElementById("tabTitle");
    if (title) title.textContent = TAB_TITLES[tabId] || tabId;

    populateTools(tabId);
}

function populateTools(tabId) {
    const selector = document.getElementById("toolSelector");
    if (!selector) return;
    selector.innerHTML = "";
    (toolsData[tabId] || []).forEach(tool => {
        const opt = document.createElement("option");
        opt.value = tool.id;
        opt.textContent = tool.name;
        selector.appendChild(opt);
    });
    handleToolChange();
}

function handleToolChange() {
    const currentToolId = document.getElementById("toolSelector")?.value;
    const allTools = Object.values(toolsData).flat();
    const activeTool = allTools.find(t => t.id === currentToolId);
    const imgSection = document.getElementById("imageSection");
    if (!imgSection) return;

    if (activeTool?.multimodal) {
        imgSection.style.display = "block";
    } else {
        imgSection.style.display = "none";
        const fileInput = document.getElementById("imageInput");
        if (fileInput) fileInput.value = "";
        const label = document.getElementById("imageLabel");
        if (label) label.innerHTML = `<i class="fa-solid fa-upload" style="display:block;font-size:18px;margin-bottom:6px;"></i>Attach screenshot or image for analysis<input type="file" id="imageInput" accept="image/*" onchange="handleImageSelect()">`;
    }
}

function handleImageSelect() {
    const fileInput = document.getElementById("imageInput");
    const label = document.getElementById("imageLabel");
    if (fileInput?.files[0] && label) {
        label.innerHTML = `<i class="fa-solid fa-paperclip" style="display:block;font-size:18px;margin-bottom:6px;"></i>${fileInput.files[0].name}<input type="file" id="imageInput" accept="image/*" onchange="handleImageSelect()">`;
    }
}

// ── BADGE ─────────────────────────────────────────────
function updateClientBadge() {
    const badge = document.getElementById("userBadge");
    const text  = document.getElementById("badgeText");
    if (!badge || !text) return;
    badge.classList.remove("hidden");

    if (ORION_ADMINS.includes(userProfile.email)) {
        text.innerHTML = `<i class="fa-solid fa-user-secret"></i> Admin Mode`;
    } else {
        const trialInfo = userProfile.status === "free"
            ? ` &nbsp;·&nbsp; ${userProfile.trialsLeft} left`
            : "";
        text.innerHTML = `<i class="fa-solid fa-crown" style="color:#f0c040"></i> ${PLAN_TIERS[userProfile.status]?.name || 'Free'}${trialInfo}`;
    }
}

function updatePlanChip() {
    const chip = document.getElementById("planChip");
    const name = document.getElementById("planChipName");
    if (!chip) return;
    const status = (userProfile.status || "free").toLowerCase();
    const tier = PLAN_TIERS[status] || PLAN_TIERS.free;
    if (name) name.textContent = tier.name;
    chip.style.display = "flex";
}

// ── HISTORY ───────────────────────────────────────────
function addToHistory(toolName, inputText) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const preview = inputText.length > 40 ? inputText.substring(0, 40) + "…" : inputText;
    sessionHistory.unshift({ toolName, preview, time: timeStr, tab: currentTab });
    renderHistory();
}

function renderHistory() {
    const scroll = document.getElementById("historyScroll");
    if (!scroll) return;

    if (sessionHistory.length === 0) {
        scroll.innerHTML = `<div class="history-empty">No history yet.<br>Generate something to get started.</div>`;
        return;
    }

    const tabLabels = { startup: "Startup", creator: "Creator", marketing: "Marketing", ecom: "E-Com" };
    scroll.innerHTML = `
        <div class="history-group-label">This Session</div>
        ${sessionHistory.map((item, i) => `
            <div class="history-item${i === 0 ? ' active' : ''}" onclick="loadHistoryItem(${i})">
                <div class="history-item-name">${escapeHtml(item.preview)}</div>
                <div class="history-item-meta">
                    <span class="history-tag">${tabLabels[item.tab] || item.tab}</span>
                    <span>${item.time}</span>
                </div>
            </div>
        `).join("")}
    `;
}

function loadHistoryItem(index) {
    document.querySelectorAll(".history-item").forEach((el, i) => {
        el.classList.toggle("active", i === index);
    });
}

// ── GENERATE ──────────────────────────────────────────
async function generateSolution() {
    const textInput   = document.getElementById("textInput").value.trim();
    const currentTool = document.getElementById("toolSelector").value;
    const fileInput   = document.getElementById("imageInput")?.files[0];

    if (!textInput) { showToast("Input field is empty."); return; }

    setOutputLoading();

    if (fileInput) {
        const reader  = new FileReader();
        reader.onload = async () => await runCoreAI(textInput, currentTool, reader.result);
        reader.onerror = () => showToast("Failed to read image file.");
        reader.readAsDataURL(fileInput);
    } else {
        await runCoreAI(textInput, currentTool, "");
    }
}

async function runCoreAI(text, tool, b64) {
    try {
        const response = await authedFetch(BACKEND, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ textInput: text, imageBase64: b64, currentTool: tool })
        });

        if (response.status === 401) {
            showToast("Session expired. Please log in again.");
            document.getElementById("loginWall")?.classList.remove("hidden");
            document.getElementById("loginWall")?.classList.add("visible");
            return;
        }

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.response) {
            document.getElementById("outputBox").innerHTML = `<p>${escapeHtml(data.response)}</p>`;
            showCopyBtn(true);

            if (typeof data.trials_left === "number") {
                userProfile.trialsLeft = data.trials_left;
                updateClientBadge();
            }

            // Add to session history
            const toolName = document.getElementById("toolSelector").options[document.getElementById("toolSelector").selectedIndex]?.text || tool;
            addToHistory(toolName, text);

        } else if (data.planBlocked) {
            showPaywall();
            document.getElementById("outputBox").innerHTML = "Upgrade required to continue.";
        } else {
            showToast(data.error || "Execution error. Try again.");
            document.getElementById("outputBox").innerHTML = "Something went wrong.";
        }

    } catch (e) {
        showToast(e.message || "Network error. Check your connection.");
        document.getElementById("outputBox").innerHTML = "Could not reach server.";
    }
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML.replace(/\n/g, "<br>");
}

// ── UI HELPERS ────────────────────────────────────────
function setOutputLoading() {
    document.getElementById("outputBox").innerHTML = `
        <div class="skeleton" style="width:85%;height:14px;margin-bottom:10px;"></div>
        <div class="skeleton" style="width:65%;height:14px;margin-bottom:10px;"></div>
        <div class="skeleton" style="width:75%;height:14px;margin-bottom:10px;"></div>
        <div class="skeleton" style="width:55%;height:14px;"></div>
    `;
    showCopyBtn(false);
}

function showCopyBtn(visible) {
    const btn = document.getElementById("copyBtn");
    if (!btn) return;
    if (visible) { btn.classList.add("visible"); btn.classList.remove("hidden"); }
    else         { btn.classList.remove("visible"); btn.classList.add("hidden"); }
}

function showPaywall() {
    const paywall = document.getElementById("paywallModal");
    if (paywall) { paywall.style.display = "flex"; paywall.classList.add("visible"); }
}

function closePaywall() {
    const paywall = document.getElementById("paywallModal");
    if (paywall) { paywall.style.display = "none"; paywall.classList.remove("visible"); }
}

function copyToClipboard() {
    const text = document.getElementById("outputBox").innerText;
    navigator.clipboard.writeText(text)
        .then(()  => showToast("Copied to clipboard."))
        .catch(()  => showToast("Copy failed. Please copy manually."));
}

function showToast(msg) {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast     = document.createElement("div");
    toast.className = "toast";
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function triggerSupport() {
    alert("Support: aaosamjhoai@gmail.com\nFor payment issues or technical help.");
}

function triggerDeleteRequest() {
    if (confirm("This will log you out and clear local session data. Continue?")) {
        signOutUser().then(() => location.reload());
    }
}

// ── PRICING ───────────────────────────────────────────
async function loadPricing() {
    try {
        const res = await fetch(`${BACKEND}?action=get-config`);
        const cfg = await res.json();
        const monthlyFinal = Math.round(cfg.monthly_base * (1 - cfg.monthly_discount / 100));
        const yearlyFinal  = Math.round(cfg.yearly_base  * (1 - cfg.yearly_discount  / 100));

        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setText("priceWeekly",         `₹${cfg.weekly_price}`);
        setText("priceMonthly",        `₹${monthlyFinal}`);
        setText("priceMonthlyDiscount",`${cfg.monthly_discount}% off`);
        setText("priceYearly",         `₹${yearlyFinal}`);
        setText("priceYearlyDiscount", `${cfg.yearly_discount}% off`);
        setText("paypalEmail",  cfg.paypal_email);
        setText("supportEmail", cfg.support_email);
        return cfg;
    } catch (e) {
        return null;
    }
}

// ── AI THINKING LIVE PANEL ──────────────────────────
(function initAIThinking() {
  const canvas = document.getElementById('aiNeuralCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    W = canvas.width  = rect.width;
    H = canvas.height = rect.height;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const particles = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.003,
      vy: (Math.random() - 0.5) * 0.003,
      r: Math.random() * 2 + 0.8,
      col: ['rgba(91,140,255,', 'rgba(0,224,198,', 'rgba(236,72,153,'][Math.floor(Math.random()*3)],
      op: Math.random() * 0.4 + 0.15
    });
  }

  function drawNeural() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > 1) p.vx *= -1;
      if (p.y < 0 || p.y > 1) p.vy *= -1;
      const px = p.x * W, py = p.y * H;
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.col + p.op + ')';
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const qx = q.x * W, qy = q.y * H;
        const d = Math.hypot(px - qx, py - qy);
        if (d < 100) {
          ctx.beginPath();
          ctx.moveTo(px, py); ctx.lineTo(qx, qy);
          ctx.strokeStyle = p.col + (0.07 * (1 - d/100)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(drawNeural);
  }
  drawNeural();

  const thoughtSets = [
    [
      [{w:'analyzing',c:'w-purple'},{w:'product',c:'w-teal'},{w:'context',c:'w-dim'},{w:'...',c:'w-dim'}],
      [{w:'identifying',c:'w-teal'},{w:'key',c:'w-dim'},{w:'selling',c:'w-pink'},{w:'points',c:'w-pink'}],
      [{w:'optimizing',c:'w-amber'},{w:'for',c:'w-dim'},{w:'conversion',c:'w-purple'}],
      [{w:'generating',c:'w-purple'},{w:'output',c:'w-teal'},{w:'...',c:'w-dim'}],
    ],
    [
      [{w:'parsing',c:'w-teal'},{w:'input',c:'w-purple'},{w:'signals',c:'w-dim'}],
      [{w:'matching',c:'w-amber'},{w:'intent',c:'w-pink'},{w:'patterns',c:'w-dim'}],
      [{w:'ranking',c:'w-purple'},{w:'best',c:'w-dim'},{w:'response',c:'w-teal'}],
      [{w:'crafting',c:'w-pink'},{w:'final',c:'w-dim'},{w:'draft',c:'w-amber'},{w:'...',c:'w-dim'}],
    ]
  ];

  const conceptSets = [
    ['product value','CTR boost','buyer intent','conversion','urgency','trust signals'],
    ['hook','pain point','CTA','social proof','emotion','brand tone']
  ];

  let setIdx = 0;
  let isGenerating = false;
  let autoInterval = null;

  function runThoughtCycle() {
    const stream = document.getElementById('aiThoughtStream');
    const badge  = document.getElementById('aiStatusBadge');
    if (!stream) return;

    stream.innerHTML = '';
    if (badge) badge.textContent = isGenerating ? 'Processing...' : 'Active';

    const lines    = thoughtSets[setIdx % thoughtSets.length];
    const concepts = conceptSets[setIdx % conceptSets.length];
    setIdx++;

    let delay = 0;
    lines.forEach((words, li) => {
      setTimeout(() => {
        const lineEl = document.createElement('div');
        lineEl.className = 'ai-thought-line';
        stream.appendChild(lineEl);
        words.forEach((w, wi) => {
          setTimeout(() => {
            const span = document.createElement('span');
            span.className = 'ai-word ' + w.c;
            span.textContent = w.w;
            lineEl.appendChild(span);
            if (li === lines.length - 1 && wi === words.length - 1) {
              const cur = document.createElement('span');
              cur.className = 'ai-cursor';
              lineEl.appendChild(cur);
            }
          }, wi * 110);
        });
      }, delay);
      delay += 550;
    });

    setTimeout(() => {
      // Metrics
      [[65,95],[55,90],[70,98]].forEach(([min,max], i) => {
        const val = Math.floor(Math.random() * (max - min) + min);
        const bar = document.getElementById('aiBar' + (i+1));
        const valEl = document.getElementById('aiVal' + (i+1));
        if (bar) bar.style.width = val + '%';
        if (valEl) valEl.textContent = val + '%';
      });
      // Concepts
      const cloud = document.getElementById('aiConceptCloud');
      if (cloud) {
        cloud.innerHTML = '';
        concepts.slice(0,5).forEach((c, i) => {
          setTimeout(() => {
            const tag = document.createElement('span');
            tag.className = 'ai-concept ' + ['tag-p','tag-t','tag-a'][i % 3];
            tag.textContent = c;
            cloud.appendChild(tag);
          }, i * 90);
        });
      }
      if (badge) badge.textContent = 'Active';
    }, 500);
  }

  // Hook into generateSolution — activate panel when user hits Generate
  const _origGenerate = window.generateSolution;
  window.generateSolution = async function() {
    isGenerating = true;
    clearInterval(autoInterval);
    runThoughtCycle();
    autoInterval = setInterval(runThoughtCycle, 5000);
    const badge = document.getElementById('aiStatusBadge');
    if (badge) badge.textContent = 'Processing...';
    await _origGenerate();
    isGenerating = false;
    if (badge) badge.textContent = 'Done ✓';
    setTimeout(() => { if (badge) badge.textContent = 'Active'; }, 2000);
  };

  // Start idle animation
  autoInterval = setInterval(runThoughtCycle, 5000);
  runThoughtCycle();
})();

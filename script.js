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
    if (!sub || !userProfile.email) return;
    // Extract a friendly name from email (part before @)
    const name = userProfile.email.split("@")[0].replace(/[._]/g, " ");
    const capitalized = name.replace(/\b\w/g, c => c.toUpperCase());
    const timeSubtexts = [
        "rise and shine",
        "hope the day's off to a great start",
        "hope your day is going well",
        "what a sky out there",
        "winding down nicely",
        "burning the midnight oil"
    ];
    const h = new Date().getHours();
    let sub_text = "welcome back";
    if (h >= 5  && h < 8)  sub_text = "rise and shine";
    else if (h >= 8  && h < 12) sub_text = "hope the day's off to a great start";
    else if (h >= 12 && h < 17) sub_text = "hope your day is going well";
    else if (h >= 17 && h < 19) sub_text = "what a sky out there";
    else if (h >= 19 && h < 21) sub_text = "winding down nicely";
    else sub_text = "burning the midnight oil";

    sub.textContent = `${capitalized} · ${sub_text}`;
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

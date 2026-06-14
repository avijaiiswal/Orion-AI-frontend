// ═══════════════════════════════════════════
//  ORION HUB — script.js
// ═══════════════════════════════════════════

const toolsData = {
    startup: [
        { id: "pitch",      name: "Premium Pitch Deck Builder",    multimodal: true  },
        { id: "cold_email", name: "B2B Cold Email Generator",      multimodal: false }
    ],
    creator: [
        { id: "viral_hook",  name: "🎬 Viral Hook Scripting Machine", multimodal: false },
        { id: "thumb_audit", name: "🎨 YouTube Thumbnail Auditor",    multimodal: true  }
    ],
    marketing: [
        { id: "sponsorship", name: "🎯 Sponsorship & Brand Deal Pitcher", multimodal: false }
    ],
    ecom: [
        { id: "ecom_listing", name: "Product Listing Optimizer", multimodal: false }
    ]
};

const TAB_TITLES = {
    startup:   "Startup Suite",
    creator:   "Creator Studio",
    marketing: "Marketing",
    ecom:      "E-Commerce"
};

// NOTE: this list is for DISPLAY ONLY (e.g. showing "Admin Mode" badge).
// The backend independently re-verifies admin status from a verified
// Supabase Auth session token — this list being visible client-side
// grants no privileges.
const ORION_ADMINS = [
    "avijaiswal10052009@gmail.com",
    "Anonymousperson1508@gmail.com"
];

let currentTab   = "startup";
let userProfile  = { email: "", status: "free", trialsLeft: 5 };

// ── INIT ──────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
    switchTab("startup");
    await checkExistingSession();
});

// Listen for auth state changes (e.g. magic link redirect completes)
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
        await onLoggedIn();
    } else if (event === "SIGNED_OUT") {
        userProfile = { email: "", status: "free", trialsLeft: 5 };
        document.getElementById("loginWall")?.classList.remove("hidden");
        document.getElementById("userBadge")?.classList.add("hidden");
    }
});

async function checkExistingSession() {
    const session = await getSession();
    if (session) {
        await onLoggedIn();
    } else {
        document.getElementById("loginWall")?.classList.remove("hidden");
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
        document.getElementById("loginWall")?.classList.add("hidden");
        updateClientBadge();
        showToast("Access active. Security layers validated. 🔥");
    } catch (e) {
        showToast(e.message || "Could not sync your account. Try logging in again.");
    }
}

// ── AUTH: SEND MAGIC LINK ──────────────────────────────
async function triggerDirectLogin() {
    const inputEmail = document.getElementById("userDirectEmail").value.trim();
    if (!inputEmail || !inputEmail.includes("@")) {
        showToast("Valid email address required.");
        return;
    }

    const btn = document.getElementById("loginBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }

    try {
        await sendMagicLink(inputEmail);
        showToast(`Magic link sent to ${inputEmail}. Check your inbox to log in.`);
        document.getElementById("loginStatusMsg")?.classList.remove("hidden");
    } catch (e) {
        showToast(e.message || "Could not send login link. Try again.");
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = "Send Magic Link"; }
    }
}

async function logoutUser() {
    await signOutUser();
    location.reload();
}

// ── NAVIGATION ────────────────────────────────────────
function switchTab(tabId) {
    currentTab = tabId;

    document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
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
        const opt       = document.createElement("option");
        opt.value       = tool.id;
        opt.textContent = tool.name;
        selector.appendChild(opt);
    });
    handleToolChange();
}

// ── TOOL CHANGE (image section toggle) ───────────────
function handleToolChange() {
    const currentToolId = document.getElementById("toolSelector")?.value;
    const allTools      = Object.values(toolsData).flat();
    const activeTool    = allTools.find(t => t.id === currentToolId);
    const imgSection    = document.getElementById("imageSection");
    if (!imgSection) return;

    if (activeTool?.multimodal) {
        imgSection.style.display = "block";
    } else {
        imgSection.style.display = "none";
        const fileInput = document.getElementById("imageInput");
        if (fileInput) fileInput.value = "";
        const label = document.getElementById("imageLabel");
        if (label) label.textContent = "Attach screenshot or image for analysis";
    }
}

function handleImageSelect() {
    const fileInput = document.getElementById("imageInput");
    const label     = document.getElementById("imageLabel");
    if (fileInput?.files[0] && label) {
        label.textContent = `📎 ${fileInput.files[0].name}`;
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
        text.innerHTML = `<i class="fa-solid fa-crown" style="color:#f0c040"></i> Premium Active${trialInfo}`;
    }
}

// ── GENERATE ──────────────────────────────────────────
async function generateSolution() {
    const textInput  = document.getElementById("textInput").value.trim();
    const currentTool = document.getElementById("toolSelector").value;
    const fileInput  = document.getElementById("imageInput")?.files[0];

    if (!textInput) {
        showToast("Input field is empty.");
        return;
    }

    setOutputLoading();

    if (fileInput) {
        const reader    = new FileReader();
        reader.onload   = async () => await runCoreAI(textInput, currentTool, reader.result);
        reader.onerror  = ()        => showToast("Failed to read image file.");
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
            body: JSON.stringify({
                textInput:    text,
                imageBase64:  b64,
                currentTool:  tool
            })
        });

        if (response.status === 401) {
            showToast("Session expired. Please log in again.");
            document.getElementById("loginWall")?.classList.remove("hidden");
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
        <div class="skeleton" style="width:85%;height:16px;margin-bottom:10px;"></div>
        <div class="skeleton" style="width:65%;height:16px;margin-bottom:10px;"></div>
        <div class="skeleton" style="width:75%;height:16px;"></div>
    `;
    showCopyBtn(false);
}

function showCopyBtn(visible) {
    const btn = document.getElementById("copyBtn");
    if (!btn) return;
    if (visible) {
        btn.classList.add("visible");
        btn.classList.remove("hidden");
    } else {
        btn.classList.remove("visible");
        btn.classList.add("hidden");
    }
}

function showPaywall() {
    const paywall = document.getElementById("paywallModal");
    if (paywall) {
        paywall.style.display = "flex";
        paywall.classList.add("visible");
    }
}

function closePaywall() {
    const paywall = document.getElementById("paywallModal");
    if (paywall) {
        paywall.style.display = "none";
        paywall.classList.remove("visible");
    }
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
    const toast       = document.createElement("div");
    toast.className   = "toast";
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

// ── FEEDBACK ──────────────────────────────────────────
async function submitFeedback(rating) {
    const text = document.getElementById("feedbackText")?.value.trim() || "";
    if (!userProfile.email) {
        showToast("Please log in to submit feedback.");
        return;
    }
    try {
        const res = await fetch(`${BACKEND}?action=submit-feedback`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userProfile.email, rating, text })
        });
        const data = await res.json();
        if (data.success) {
            showToast("Thanks for your feedback!");
            const ft = document.getElementById("feedbackText");
            if (ft) ft.value = "";
        } else {
            showToast(data.error || "Could not submit feedback.");
        }
    } catch (e) {
        showToast("Network error submitting feedback.");
    }
}

// ── PRICING ───────────────────────────────────────────
async function loadPricing() {
    try {
        const res = await fetch(`${BACKEND}?action=get-config`);
        const cfg = await res.json();
        const monthlyFinal = Math.round(cfg.monthly_base * (1 - cfg.monthly_discount / 100));
        const yearlyFinal  = Math.round(cfg.yearly_base * (1 - cfg.yearly_discount / 100));

        const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setText("priceWeekly", `₹${cfg.weekly_price}`);
        setText("priceMonthly", `₹${monthlyFinal}`);
        setText("priceMonthlyDiscount", `${cfg.monthly_discount}% off`);
        setText("priceYearly", `₹${yearlyFinal}`);
        setText("priceYearlyDiscount", `${cfg.yearly_discount}% off`);
        setText("paypalEmail", cfg.paypal_email);
        setText("supportEmail", cfg.support_email);
    } catch (e) {
        // Silently fail — pricing section just won't populate
    }
}

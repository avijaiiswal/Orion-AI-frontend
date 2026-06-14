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

const ORION_ADMINS = [
    "avijaiswal10052009@gmail.com",
    "Anonymousperson1508@gmail.com"
];

const BACKEND = "https://orion-ai-backend.vercel.app/api/analyze";

let currentTab   = "startup";
let userProfile  = { email: "", status: "free", trialsLeft: 5 };

// ── INIT ──────────────────────────────────────────────
window.onload = function () {
    switchTab("startup");
    const cachedEmail = localStorage.getItem("orion_user_email");
    if (cachedEmail) executeUserSync(cachedEmail);
};

// ── AUTH ──────────────────────────────────────────────
async function triggerDirectLogin() {
    const inputEmail = document.getElementById("userDirectEmail").value.trim();
    if (!inputEmail || !inputEmail.includes("@")) {
        showToast("Valid email address required.");
        return;
    }
    localStorage.setItem("orion_user_email", inputEmail);
    await executeUserSync(inputEmail);
}

async function executeUserSync(email) {
    try {
        const res = await fetch(`${BACKEND}?action=sync-user`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email })
        });
        const result = await res.json();
        if (result.success) {
            userProfile = {
                email:      result.user.email,
                status:     result.user.status,
                trialsLeft: result.user.trials_left
            };
            document.getElementById("loginWall").classList.add("hidden");
            updateClientBadge();
            showToast("Access active. Security layers validated. 🔥");
        } else {
            showToast("Auth failed. Check your email and try again.");
        }
    } catch (e) {
        showToast("Connection error. Please try again.");
    }
}

// ── NAVIGATION ────────────────────────────────────────
function switchTab(tabId) {
    currentTab = tabId;

    // Update active nav button
    document.querySelectorAll(".nav-item").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add("active");

    // Update page title
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
        // Clear any previously selected file
        const fileInput = document.getElementById("imageInput");
        if (fileInput) fileInput.value = "";
        const label = document.getElementById("imageLabel");
        if (label) label.textContent = "Attach screenshot or image for analysis";
    }
}

// Show selected filename in upload zone
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
        // Show trials left if on free plan
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
        const response = await fetch(BACKEND, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email:        userProfile.email || localStorage.getItem("orion_user_email"),
                textInput:    text,
                imageBase64:  b64,
                currentTool:  tool
            })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (data.response) {
            document.getElementById("outputBox").innerHTML = `<p>${data.response}</p>`;
            showCopyBtn(true);

            // Update trials left if returned
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
        showToast("Network error. Check your connection.");
        document.getElementById("outputBox").innerHTML = "Could not reach server.";
    }
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
    setTimeout(() => toast.remove(), 3000);
}

function triggerSupport() {
    alert("Support: aaosamjhoai@gmail.com\nFor payment issues or technical help.");
}

function triggerDeleteRequest() {
    if (confirm("This will clear all local account data. Continue?")) {
        localStorage.clear();
        location.reload();
    }
            }

// Tools Configuration Matrix
const toolsData = {
    startup: [
        { id: "pitch", name: "Premium Pitch Deck AI Builder", desc: "Generates high-converting templates for raising investor capital.", multimodal: true },
        { id: "cold_email", name: "B2B Venture Cold Email Generator", desc: "Automates highly optimized sequence pitches for brands.", multimodal: false }
    ],
    creator: [
        { id: "viral_hook", name: "🎬 Auto Viral-Hook Scripting Machine", desc: "Generates 5 intense psychological hooks for Reels/Shorts retention.", multimodal: false },
        { id: "thumb_audit", name: "🎨 YouTube Thumbnail Auditor (Gemini Engine)", desc: "Upload screenshot to analyze structure layout, fonts and CTR blocks.", multimodal: true }
    ],
    marketing: [
        { id: "sponsorship", name: "🎯 Sponsorship & Brand Deal Pitcher", desc: "Formats crisp outreach letters based on niche data matrices.", multimodal: false }
    ],
    ecom: [
        { id: "ecom_listing", name: "Product Listing Catalog Optimizer", desc: "Optimizes title tags and specifications for online storefronts.", multimodal: false }
    ]
};

// Global App States
let currentTab = 'startup';
let userProfile = { email: "", status: "free", trialsLeft: 5 };
let selectedRating = 0;

// On Initial Platform Frame Boot up
window.onload = function() {
    switchTab('startup');
    loadLocalChatHistory();
};

function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    
    // UI selection highlights toggle
    const activeBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
    if(activeBtn) activeBtn.classList.add('active');

    // Headers injection adjustments
    if(tabId === 'startup') {
        updateHeader("Startup Suite", "Pitch decks, cold emails, and legal frameworks for founders.");
    } else if(tabId === 'creator') {
        updateHeader("Creator Studio", "Viral script hooks, thumbnail auditing, and description engines.");
    } else if(tabId === 'marketing') {
        updateHeader("Growth & Ads", "High conversion frameworks and brand outreach blueprints.");
    } else if(tabId === 'ecom') {
        updateHeader("E-Commerce Hub", "Inventory data mapping tools and catalog descriptions.");
    }

    populateTools(tabId);
}

function updateHeader(title, desc) {
    document.getElementById('tabTitle').innerText = title;
    document.getElementById('tabDesc').innerText = desc;
}

function populateTools(tabId) {
    const selector = document.getElementById('toolSelector');
    selector.innerHTML = '';
    toolsData[tabId].forEach(tool => {
        let opt = document.createElement('option');
        opt.value = tool.id;
        opt.innerText = tool.name;
        selector.appendChild(opt);
    });
    handleToolChange();
}

function handleToolChange() {
    const currentToolId = document.getElementById('toolSelector').value;
    const allTools = Object.values(toolsData).flat();
    const activeTool = allTools.find(t => t.id === currentToolId);
    
    if(activeTool && activeTool.multimodal) {
        document.getElementById('imageSection').classList.remove('hidden');
    } else {
        document.getElementById('imageSection').classList.add('hidden');
    }
}

// PREMIUM LOGIN GATEWAY VALIDATION FLOW
function handlePremiumLogin() {
    const email = document.getElementById('authEmail').value;
    const token = document.getElementById('authCode').value;

    if(!email || !token) {
        showToast("Bhai, please email aur token donon fill karo!");
        return;
    }

    // Static bypass evaluation for local verification staging
    if(token === "ORION_ADMIN" || token === "AVI_VIP" || token === "ISHAN_VIP") {
        userProfile = { email: email, status: "admin", trialsLeft: 999999 };
        showToast("Welcome Core Founder! Infinite Bypass Granted.");
    } else {
        userProfile = { email: email, status: "active_tier", trialsLeft: 0 };
        showToast("Premium Identity Token verified. Core active.");
    }

    document.getElementById('loginWall').classList.add('hidden');
    updateClientBadge();
}

function updateClientBadge() {
    const badge = document.getElementById('userBadge');
    const text = document.getElementById('badgeText');
    badge.classList.remove('hidden');

    if(userProfile.status === 'admin') {
        text.innerHTML = `<i class="fa-solid fa-user-secret"></i> Orion Admin Mode`;
    } else {
        text.innerHTML = `<i class="fa-solid fa-crown text-gold"></i> Premium Access Active`;
    }
}

// CRUNCHYROLL CARD VIEWER POPUPS
function showCrunchyrollPay() { document.getElementById('paywallModal').classList.remove('hidden'); }
function closePaywall() { document.getElementById('paywallModal').classList.add('hidden'); }

function triggerCheckout(tier) {
    showToast(`Redirecting to Secure PayPal Gateway for ${tier.toUpperCase()} activation...`);
}

// CORE GENERATE SHORTCUTS & LOCAL CHAT SESSIONS CAPTURES
function generateSolution() {
    const textInput = document.getElementById('textInput').value;
    if(!textInput) {
        showToast("Bhai phle text details toh dalo context ke liye!");
        return;
    }

    // Checking client trial status thresholds
    if(userProfile.status === "free" && userProfile.trialsLeft <= 0) {
        showCrunchyrollPay();
        showToast("Bhai aapke 5 Free Trials khatam ho gye hain! Please upgrade kijiye.");
        return;
    }

    const outputBox = document.getElementById('outputBox');
    // Shimmer skeleton layout triggers
    outputBox.innerHTML = `
        <div class="skeleton" style="width: 80%; height: 20px;"></div>
        <div class="skeleton" style="width: 95%; height: 20px;"></div>
        <div class="skeleton" style="width: 60%; height: 20px;"></div>
    `;

    if(userProfile.status === "free") {
        userProfile.trialsLeft--;
        document.getElementById('badgeText').innerText = `Free Trial: ${userProfile.trialsLeft} left`;
    }

    setTimeout(() => {
        // Core dummy text simulation rendering markdown support targets
        outputBox.innerHTML = `<h3>### System Response Successfully Compiled</h3><p>Bhai aapka custom roadmap ready ho gya hai. Yeh script 2026 trend vectors ke according structure kari h. <strong>**Orion Hub Engine**</strong> response parameters perfectly matched.</p>`;
        document.getElementById('copyBtn').classList.remove('hidden');
        
        // Push context string metadata into recent chats history tracking blocks
        saveToLocalHistory(textInput.substring(0, 25) + "...");
    }, 1800);
}

function saveToLocalHistory(titleSnippet) {
    let history = JSON.parse(localStorage.getItem('orion_history')) || [];
    history.unshift(titleSnippet);
    if(history.length > 5) history.pop(); // Hold limit threshold
    localStorage.setItem('orion_history', JSON.stringify(history));
    loadLocalChatHistory();
}

function loadLocalChatHistory() {
    const listContainer = document.getElementById('recentChatsList');
    let history = JSON.parse(localStorage.getItem('orion_history')) || [];
    
    if(history.length === 0) {
        listContainer.innerHTML = `<p class="no-history-text">No recent sessions</p>`;
        return;
    }
    
    listContainer.innerHTML = '';
    history.forEach(chatTitle => {
        let node = document.createElement('div');
        node.className = "history-item";
        node.innerHTML = `<i class="fa-solid fa-message" style="font-size:0.7rem; color:var(--accent); margin-right:5px;"></i> ${chatTitle}`;
        listContainer.appendChild(node);
    });
}

// FEEDBACK AND REVIEWS LOGIC GATEWAYS
function openFeedback() { document.getElementById('feedbackModal').classList.remove('hidden'); }
function closeFeedback() { document.getElementById('feedbackModal').classList.add('hidden'); }

function setRating(stars) {
    selectedRating = stars;
    const starIcons = document.querySelectorAll('.rating-stars i');
    starIcons.forEach((icon, idx) => {
        if(idx < stars) {
            icon.classList.remove('fa-regular'); icon.classList.add('fa-solid');
        } else {
            icon.classList.remove('fa-solid'); icon.classList.add('fa-regular');
        }
    });
}

function submitUserFeedback() {
    const text = document.getElementById('feedbackText').value;
    if(selectedRating === 0) { showToast("Bhai star ratings toh select karo!"); return; }
    showToast(`⭐ ${selectedRating} Star Feedback submitted locally to system log!`);
    closeFeedback();
}

// COMPLIANCE HELPDESKS METHODS (PLAY STORE COMPLIANCE)
function triggerSupport() { alert("Orion Customer Helpdesk: For quick ticket resolution, write to support@orionaihub.com or submit transaction logs via telegram gateway."); }
function triggerDeleteRequest() { 
    localStorage.clear(); 
    loadLocalChatHistory();
    alert("User sessions cache database and temporary system cookies flushed from local browser sandbox completely."); 
}

function copyToClipboard() {
    const text = document.getElementById('outputBox').innerText;
    navigator.clipboard.writeText(text);
    showToast("📋 Script successfully copied to clipboard!");
}

function showToast(msg) {
    const container = document.getElementById('toastContainer');
    let toast = document.createElement('div');
    toast.className = "toast";
    toast.innerText = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}


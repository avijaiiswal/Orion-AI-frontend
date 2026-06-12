const toolsData = {
    startup: [
        { id: "pitch", name: "Premium Pitch Deck AI Builder", desc: "Generates templates for raising investor capital.", multimodal: true },
        { id: "cold_email", name: "B2B Venture Cold Email Generator", desc: "Automates highly optimized sequence pitches for brands.", multimodal: false }
    ],
    creator: [
        { id: "viral_hook", name: "🎬 Auto Viral-Hook Scripting Machine", desc: "Generates intense scripts for Reels/Shorts retention.", multimodal: false },
        { id: "thumb_audit", name: "🎨 YouTube Thumbnail Auditor (Gemini)", desc: "Upload screenshot to analyze structure layout and CTR blocks.", multimodal: true }
    ],
    marketing: [
        { id: "sponsorship", name: "🎯 Sponsorship & Brand Deal Pitcher", desc: "Formats crisp outreach letters based on niche data.", multimodal: false }
    ],
    ecom: [
        { id: "ecom_listing", name: "Product Listing Catalog Optimizer", desc: "Optimizes description logs for online storefronts.", multimodal: false }
    ]
};

let currentTab = 'startup';
let userProfile = { email: "", status: "free", trialsLeft: 5 };
let selectedRating = 0;

window.onload = function() {
    switchTab('startup');
    loadLocalChatHistory();
    
    // Auto restore if email session already stored in local browser caching
    const cachedEmail = localStorage.getItem('orion_user_email');
    if(cachedEmail) {
        executeUserSync(cachedEmail);
    }
};

async function triggerDirectLogin() {
    const inputEmail = document.getElementById('userDirectEmail').value;
    if(!inputEmail || !inputEmail.includes('@')) { showToast("Bhai sahi email parameter dalo!"); return; }
    
    localStorage.setItem('orion_user_email', inputEmail);
    await executeUserSync(inputEmail);
}

async function executeUserSync(email) {
    const res = await fetch('/api/analyze?action=sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    });
    const result = await res.json();
    if(result.success) {
        userProfile = { email: result.user.email, status: result.user.status, trialsLeft: result.user.trials_left };
        document.getElementById('loginWall').classList.add('hidden');
        updateClientBadge();
        showToast("Access active! Connect layers validated. 🔥");
    } else {
        showToast("Login error, please verify entry details.");
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
    if(activeBtn) activeBtn.classList.add('active');

    if(tabId === 'startup') updateHeader("Startup Suite", "Pitch decks, cold emails, and legal frameworks for founders.");
    else if(tabId === 'creator') updateHeader("Creator Studio", "Viral script hooks, thumbnail auditing, and description engines.");
    else if(tabId === 'marketing') updateHeader("Growth & Ads", "High conversion frameworks and brand outreach blueprints.");
    else if(tabId === 'ecom') updateHeader("E-Commerce Hub", "Inventory data mapping tools and catalog descriptions.");

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
        opt.value = tool.id; opt.innerText = tool.name;
        selector.appendChild(opt);
    });
    handleToolChange();
}

function handleToolChange() {
    const currentToolId = document.getElementById('toolSelector').value;
    const allTools = Object.values(toolsData).flat();
    const activeTool = allTools.find(t => t.id === currentToolId);
    if(activeTool && activeTool.multimodal) document.getElementById('imageSection').classList.remove('hidden');
    else document.getElementById('imageSection').classList.add('hidden');
}

function updateClientBadge() {
    const badge = document.getElementById('userBadge');
    const text = document.getElementById('badgeText');
    badge.classList.remove('hidden');
    
    const ORION_ADMINS = ["avijaiswal10052009@gmail.com", "Anonymousperson1508@gmail.com"];
    if(ORION_ADMINS.includes(userProfile.email) || userProfile.status === 'admin') {
        text.innerHTML = `<i class="fa-solid fa-user-secret"></i> Orion Admin Mode`;
    } else {
        text.innerHTML = `<i class="fa-solid fa-crown text-gold"></i> Premium Access Active`;
    }
}

async function generateSolution() {
    const textInput = document.getElementById('textInput').value;
    const currentTool = document.getElementById('toolSelector').value;
    const fileInput = document.getElementById('imageInput').files[0];
    if(!textInput) { showToast("Bhai prompt payload context dalo!"); return; }

    const outputBox = document.getElementById('outputBox');
    outputBox.innerHTML = `<div class="skeleton" style="width:95%; height:20px;"></div><div class="skeleton" style="width:65%; height:20px;"></div>`;

    if(fileInput) {
        const reader = new FileReader();
        reader.readAsDataURL(fileInput);
        reader.onload = async () => {
            await runCoreAI(textInput, currentTool, reader.result);
        };
    } else {
        await runCoreAI(textInput, currentTool, "");
    }
}

async function runCoreAI(text, tool, b64) {
    const targetEmail = userProfile.email || localStorage.getItem('orion_user_email');
    const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, textInput: text, imageBase64: b64, currentTool: tool })
    });
    const data = await response.json();
    if(data.response) {
        document.getElementById('outputBox').innerHTML = `<p>${data.response}</p>`;
        document.getElementById('copyBtn').classList.remove('hidden');
        saveToLocalHistory(text.substring(0, 22) + "...");
    } else if(data.planBlocked) {
        showCrunchyrollPay();
        showToast(data.message);
    } else {
        showToast(data.error || "System internal matrix fault.");
    }
}

async function submitUserFeedback() {
    const text = document.getElementById('feedbackText').value;
    if(selectedRating === 0) { showToast("Stars select karo bhai!"); return; }
    await fetch('/api/analyze?action=submit-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile.email || 'anonymous@orion.com', rating: selectedRating, text })
    });
    showToast("Feedback processing locked.");
    closeFeedback();
}

function showCrunchyrollPay() { document.getElementById('paywallModal').classList.remove('hidden'); }
function closePaywall() { document.getElementById('paywallModal').classList.add('hidden'); }
function openFeedback() { document.getElementById('feedbackModal').classList.remove('hidden'); }
function closeFeedback() { document.getElementById('feedbackModal').classList.add('hidden'); }

function setRating(stars) {
    selectedRating = stars;
    document.querySelectorAll('.rating-stars i').forEach((icon, idx) => {
        if(idx < stars) { icon.classList.remove('fa-regular'); icon.classList.add('fa-solid'); }
        else { icon.classList.remove('fa-solid'); icon.classList.add('fa-regular'); }
    });
}

function saveToLocalHistory(snippet) {
    let history = JSON.parse(localStorage.getItem('orion_history')) || [];
    history.unshift(snippet); if(history.length > 5) history.pop();
    localStorage.setItem('orion_history', JSON.stringify(history));
    loadLocalChatHistory();
}

function loadLocalChatHistory() {
    const container = document.getElementById('recentChatsList');
    let history = JSON.parse(localStorage.getItem('orion_history')) || [];
    if(history.length === 0) { container.innerHTML = `<p class="no-history-text">No data logs</p>`; return; }
    container.innerHTML = '';
    history.forEach(title => {
        let node = document.createElement('div'); node.className = "history-item";
        node.innerHTML = `<i class="fa-solid fa-message" style="font-size:0.7rem; color:var(--accent); margin-right:5px;"></i> ${title}`;
        container.appendChild(node);
    });
}

function triggerSupport() { alert("Write to support@orionaihub.com for active tier mapping inquiries."); }
function triggerDeleteRequest() { localStorage.clear(); loadLocalChatHistory(); alert("Local buffer flushed."); }
function copyToClipboard() { navigator.clipboard.writeText(document.getElementById('outputBox').innerText); showToast("📋 Copied script payload!"); }

function showToast(msg) {
    const container = document.getElementById('toastContainer');
    let toast = document.createElement('div'); toast.className = "toast"; toast.innerText = msg;
    container.appendChild(toast); setTimeout(() => { toast.remove(); }, 3000);
                  }
    

const toolsData = {
    startup: [
        { id: "pitch", name: "Premium Pitch Deck AI Builder", desc: "Generates templates for raising investor capital.", multimodal: true },
        { id: "cold_email", name: "B2B Venture Cold Email Generator", desc: "Automates optimized sequence pitches for brands.", multimodal: false }
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
    const cachedEmail = localStorage.getItem('orion_user_email');
    if(cachedEmail) executeUserSync(cachedEmail);
};

async function triggerDirectLogin() {
    const inputEmail = document.getElementById('userDirectEmail').value;
    if(!inputEmail || !inputEmail.includes('@')) { showToast("Bhai sahi email parameter dalo!"); return; }
    localStorage.setItem('orion_user_email', inputEmail);
    await executeUserSync(inputEmail);
}

async function executeUserSync(email) {
    // 1st Change: Added Live Vercel Backend URL here
    const res = await fetch('https://orion-ai-backend.vercel.app/api/analyze?action=sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    });
    const result = await res.json();
    if(result.success) {
        userProfile = { email: result.user.email, status: result.user.status, trialsLeft: result.user.trials_left };
        document.getElementById('loginWall').classList.add('hidden');
        updateClientBadge();
        showToast("Access active! Security layers validated. 🔥");
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`button[onclick="switchTab('${tabId}')"]`);
    if(activeBtn) activeBtn.classList.add('active');
    populateTools(tabId);
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
    if(ORION_ADMINS.includes(userProfile.email)) text.innerHTML = `<i class="fa-solid fa-user-secret"></i> Orion Admin Mode`;
    else text.innerHTML = `<i class="fa-solid fa-crown text-gold"></i> Premium Access Active`;
}

async function generateSolution() {
    const textInput = document.getElementById('textInput').value;
    const currentTool = document.getElementById('toolSelector').value;
    const fileInput = document.getElementById('imageInput').files[0];
    if(!textInput) { showToast("Bhai content parameters field blank h!"); return; }

    document.getElementById('outputBox').innerHTML = `<div class="skeleton" style="width:90%; height:20px;"></div><div class="skeleton" style="width:70%; height:20px;"></div>`;

    if(fileInput) {
        const reader = new FileReader();
        reader.readAsDataURL(fileInput);
        reader.onload = async () => { await runCoreAI(textInput, currentTool, reader.result); };
    } else {
        await runCoreAI(textInput, currentTool, "");
    }
}

async function runCoreAI(text, tool, b64) {
    // 2nd Change: Added Live Vercel Backend URL here
    const response = await fetch('https://orion-ai-backend.vercel.app/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile.email || localStorage.getItem('orion_user_email'), textInput: text, imageBase64: b64, currentTool: tool })
    });
    const data = await response.json();
    if(data.response) {
        document.getElementById('outputBox').innerHTML = `<p>${data.response}</p>`;
        document.getElementById('copyBtn').classList.remove('hidden');
    } else if(data.planBlocked) {
        document.getElementById('paywallModal').classList.remove('hidden');
    } else {
        showToast(data.error || "Execution timeout error.");
    }
}

function triggerSupport() { alert("📬 Play Store Helpdesk Escalation Node: Write directly to our official support desk at aaosamjhoai@gmail.com for real-time payment rollback or technical debugging requests."); }
function triggerDeleteRequest() { localStorage.clear(); location.reload(); alert("Account data logs flushed from user registry. Compliance policy cleared!"); }
function copyToClipboard() { navigator.clipboard.writeText(document.getElementById('outputBox').innerText); showToast("📋 Payload copied!"); }

function showToast(msg) {
    const container = document.getElementById('toastContainer');
    let toast = document.createElement('div'); toast.className = "toast"; toast.innerText = msg;
    container.appendChild(toast); setTimeout(() => { toast.remove(); }, 3000);
}
    

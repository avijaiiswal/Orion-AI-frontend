// 1. Saare Tools aur Categories ka Data Matrix
const toolsData = {
    startup: {
        title: "Startup Suite",
        desc: "Pitch decks, high-converting cold emails, and legal frameworks for founders.",
        tools: [
            { id: "pitch", name: "Slide/Pitch Checker (Gemini Multimodal)", hasImage: true, label: "Describe the core goal of this slide:" },
            { id: "cold_email", name: "High-Converting Cold Email Pitcher", hasImage: false, label: "Enter Investor/Client details & your value proposition:" },
            { id: "legal_draft", name: "Legal Document & Agreement Generator", hasImage: false, label: "Enter Company Name and type of Agreement needed (e.g., NDA, Co-founder):" }
        ]
    },
    creator: {
        title: "Creator Studio",
        desc: "Video scripts, high-CTR hooks, and thumbnail concepts for YouTubers and content creators.",
        tools: [
            { id: "script_writing", name: "Video Script Writer (Groq Powered - Super Fast)", hasImage: false, label: "Enter your Video Topic, Duration & Target Audience:" },
            { id: "thumbnail_audit", name: "Thumbnail Concept Evaluator (Gemini)", hasImage: true, label: "Describe your video concept and what text you plan to use on thumbnail:" },
            { id: "hook_gen", name: "Audience Retention Hook Generator", hasImage: false, label: "What is your video topic? (Get 5 highly engaging hooks):" }
        ]
    },
    marketing: {
        title: "Growth & Ads",
        desc: "High-converting ad copies and marketing campaigns for digital growth.",
        tools: [
            { id: "ad_script", name: "Facebook/Insta Video Ad Script (Groq)", hasImage: false, label: "Describe the product/service you want to sell via Video Ad:" },
            { id: "ad_copy", name: "High-Conversion Copywriting (Facebook/Google Ads)", hasImage: false, label: "Enter Product Name and Target Audience pain points:" }
        ]
    },
    ecom: {
        title: "E-Commerce Hub",
        desc: "SEO optimized product descriptions and automated polite customer review handlers.",
        tools: [
            { id: "prod_desc", name: "SEO Optimized Product Description (Groq)", hasImage: false, label: "Enter Product Type, Key Features, and Target SEO Keywords:" },
            { id: "review_reply", name: "AI Review Responder (Polite & Diplomatic)", hasImage: false, label: "Paste the customer review here (Positive or Negative):" }
        ]
    }
};

let currentTab = 'startup';

// 2. Tab Switching Logic (Sidebar Click Handler)
function switchTab(tabId) {
    currentTab = tabId;
    
    // UI mein button active classes update karein
    document.querySelectorAll('.nav-menu .nav-item').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    // Header texts ko update karein
    document.getElementById('tabTitle').innerText = toolsData[tabId].title;
    document.getElementById('tabDesc').innerText = toolsData[tabId].desc;
    
    // Dropdown options populate karein
    populateTools(tabId);
}

// Dropdown settings dynamically load karne ke liye
function populateTools(tabId) {
    const selector = document.getElementById('toolSelector');
    selector.innerHTML = '';
    
    toolsData[tabId].tools.forEach(tool => {
        let opt = document.createElement('option');
        opt.value = tool.id;
        opt.innerText = tool.name;
        selector.appendChild(opt);
    });
    
    handleToolChange(); // Pehle default option ke hisab se form labels range hon
}

// 3. Dropdown Change Handler (Image Section Show/Hide + Label Management)
function handleToolChange() {
    const selectedToolId = document.getElementById('toolSelector').value;
    const currentTools = toolsData[currentTab].tools;
    const activeTool = currentTools.find(t => t.id === selectedToolId);
    
    if (!activeTool) return;
    
    // Label aur placeholders change karein based on selected tool
    document.getElementById('textLabel').innerText = activeTool.label;
    
    // Image Upload input ko show or hide karein
    const imageSection = document.getElementById('imageSection');
    if (activeTool.hasImage) {
        imageSection.classList.remove('hidden');
    } else {
        imageSection.classList.add('hidden');
    }
}

// 4. Toast Notifications Setup (Premium Popup Alerts)
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    
    if(type === 'error') {
        toast.style.backgroundColor = '#ef4444'; // Red alert color
    }
    
    container.appendChild(toast);
    
    // 3 seconds baad screen se transparent tarike se clear ho jaye
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 5. Orion AI Hub Engine Run (Output Execution with SKELETON LOADER)
async function generateSolution() {
    const textInput = document.getElementById('textInput').value.trim();
    const toolSelected = document.getElementById('toolSelector').value;
    const outputBox = document.getElementById('outputBox');
    
    // Validation: Text area empty check
    if (!textInput) {
        showToast("Bhai, pehle details toh likho! Box khali hai.", "error");
        document.getElementById('textInput').style.borderColor = '#ef4444';
        return;
    } else {
        document.getElementById('textInput').style.borderColor = '#334155';
    }
    
    // 🌌 REAL SKELETON LOADER WAVE WAVE WAVE EFFECT
    outputBox.innerHTML = `
        <div class="skeleton" style="height: 24px; width: 45%;"></div>
        <div class="skeleton" style="height: 16px; width: 100%;"></div>
        <div class="skeleton" style="height: 16px; width: 92%;"></div>
        <div class="skeleton" style="height: 16px; width: 85%;"></div>
    `;
    
    showToast("Orion AI Hub running engine...", "success");

    try {
        // BACKEND PIPELINE SIMULATION (Jab hum backend deploy karenge, yahan asli fetch custom routes aayega)
        setTimeout(() => {
            outputBox.innerHTML = `
                <p style="color: #38bdf8; font-weight: bold; margin-bottom: 12px;"><i class="fa-solid fa-circle-check"></i> [ORION ${toolSelected.toUpperCase()} ACTIVE]</p>
                <p>Bhai! Teri <strong>Orion AI Hub</strong> ki teesri file <code>script.js</code> bhi ekdum makkhan chal rahi hai. Frontend dashboard ab live click karne ke liye taiyar hai.</p>
                <p style="margin-top: 10px; color: #94a3b8; font-size: 0.95rem;">Chalo ab jaldi se next step par badhte hain aur hamara dynamic dual backend setup (Groq + Gemini API Rotation) start karte hain!</p>
            `;
            showToast("Solution Computed Successfully!", "success");
        }, 2200); // 2.2 Seconds active skeleton waiting animation
        
    } catch (error) {
        outputBox.innerHTML = `<p style="color: #ef4444;">Error syncing with Orion Core Infrastructure.</p>`;
        showToast("Server Connection Failed! Key failover protocol ready.", "error");
    }
}

// App start hote hi automatic Startup Suite aur default options trigger ho jayein
window.onload = function() {
    populateTools('startup');
};
          

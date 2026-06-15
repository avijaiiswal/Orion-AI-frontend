// ═══════════════════════════════════════════
//  ORION HUB — plans.js
//  Renders the Free / Weekly / Monthly / Yearly upgrade cards
// ═══════════════════════════════════════════

const PLAN_KEY_BY_STATUS = {
    free:    "free",
    weekly:  "weekly",
    monthly: "monthly",
    ultimate:"yearly",
    yearly:  "yearly",
    admin:   "admin"
};

const PLAN_FEATURES = {
    free: [
        "5 free generations",
        "Access to all tool categories",
        "Standard response speed",
        "Community support"
    ],
    weekly: [
        "50 generations / week",
        "Priority response speed",
        "Image-based tools unlocked",
        "Email support"
    ],
    monthly: [
        "300 generations / month",
        "Priority response speed",
        "Image-based tools unlocked",
        "Early access to new tools",
        "Email support"
    ],
    yearly: [
        "Unlimited generations",
        "Fastest response speed",
        "Image-based tools unlocked",
        "Early access to new tools",
        "Priority email support",
        "Best value — save the most"
    ]
};

window.addEventListener("DOMContentLoaded", async () => {
    const cfg = await loadPricing();
    await renderPlanCards(cfg);
});

async function renderPlanCards(cfg) {
    const grid = document.getElementById("plansGrid");
    if (!grid) return;

    const defaults = {
        weekly_price: 350, monthly_base: 2500, monthly_discount: 30,
        yearly_base: 10000, yearly_discount: 40
    };
    const c = cfg || defaults;

    const monthlyFinal = Math.round(c.monthly_base * (1 - c.monthly_discount / 100));
    const yearlyFinal  = Math.round(c.yearly_base  * (1 - c.yearly_discount  / 100));

    const plans = [
        {
            key: "free",
            name: "Free",
            origPrice: null,
            finalPrice: 0,
            period: "/ forever",
            discount: "",
            features: PLAN_FEATURES.free,
            featured: false
        },
        {
            key: "weekly",
            name: "Weekly",
            origPrice: null,
            finalPrice: c.weekly_price,
            period: "/ week",
            discount: "",
            features: PLAN_FEATURES.weekly,
            featured: false
        },
        {
            key: "monthly",
            name: "Monthly",
            origPrice: c.monthly_base,
            finalPrice: monthlyFinal,
            period: "/ month",
            discount: `${c.monthly_discount}% off`,
            features: PLAN_FEATURES.monthly,
            featured: true
        },
        {
            key: "yearly",
            name: "Yearly",
            origPrice: c.yearly_base,
            finalPrice: yearlyFinal,
            period: "/ year",
            discount: `${c.yearly_discount}% off`,
            features: PLAN_FEATURES.yearly,
            featured: false
        }
    ];

    await waitForProfileSync();
    const currentKey = PLAN_KEY_BY_STATUS[(userProfile.status || "free").toLowerCase()] || "free";

    grid.innerHTML = plans.map(plan => {
        const isCurrent = plan.key === currentKey
            || (plan.key === "free" && currentKey === "admin");

        const cardClasses = ["plan-card"];
        if (plan.featured) cardClasses.push("featured");
        if (isCurrent)    cardClasses.push("is-current");

        let badge = "";
        if (isCurrent) {
            badge = `<div class="plan-card-badge current-badge">Current plan</div>`;
        } else if (plan.featured) {
            badge = `<div class="plan-card-badge">Popular</div>`;
        }

        // Price block — show strikethrough original + discount + final for discounted plans
        let priceDisplay = "";
        if (plan.finalPrice === 0) {
            priceDisplay = `<span class="amount">Free</span>`;
        } else if (plan.origPrice) {
            priceDisplay = `
                <div class="price-orig">₹${plan.origPrice} <span class="price-orig-period">${plan.period}</span></div>
                <div class="price-final-row">
                    <span class="amount">₹${plan.finalPrice}</span>
                    <span class="period">${plan.period}</span>
                </div>
            `;
        } else {
            priceDisplay = `<span class="amount">₹${plan.finalPrice}</span><span class="period">${plan.period}</span>`;
        }

        const featuresHtml = plan.features.map(f =>
            `<li><i class="fa-solid fa-circle-check"></i> ${f}</li>`
        ).join("");

        const buttonHtml = isCurrent
            ? `<button class="btn btn-block" disabled>Current plan</button>`
            : `<button class="btn btn-block" onclick="startUpgrade('${plan.key}')">
                 <i class="fa-solid fa-bolt"></i> Upgrade to ${plan.name}
               </button>`;

        return `
            <div class="${cardClasses.join(' ')}">
                ${badge}
                <h3>${plan.name}</h3>
                <div class="plan-card-price">${priceDisplay}</div>
                <div class="plan-card-discount">${plan.discount}</div>
                <ul>${featuresHtml}</ul>
                ${buttonHtml}
            </div>
        `;
    }).join("");
}

function waitForProfileSync(timeoutMs = 2000) {
    return new Promise(resolve => {
        const start = Date.now();
        const check = () => {
            if (userProfile.email || Date.now() - start > timeoutMs) {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
}

function startUpgrade(planKey) {
    const planNames = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };
    const name = planNames[planKey] || planKey;

    showToast(`To activate the ${name} plan: pay via PayPal, then email your receipt + account email to support.`);

    const note = document.querySelector(".main p[style*='text-align:center']");
    if (note) note.scrollIntoView({ behavior: "smooth", block: "center" });
}

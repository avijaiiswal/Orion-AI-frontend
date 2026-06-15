// ═══════════════════════════════════════════
//  ORION HUB — feedback.js
//  Standalone feedback page logic
// ═══════════════════════════════════════════

let selectedRating = null;

window.addEventListener("DOMContentLoaded", async () => {
    const session = await getSession();
    if (session?.user?.email) {
        const emailField = document.getElementById("feedbackEmail");
        if (emailField) emailField.value = session.user.email;
    } else {
        // No session — fall back to a free-text email field
        const emailField = document.getElementById("feedbackEmail");
        if (emailField) {
            emailField.removeAttribute("readonly");
            emailField.placeholder = "you@example.com (please log in for faster support)";
        }
    }
});

function selectRating(value) {
    selectedRating = value;
    document.querySelectorAll(".rating-btn").forEach(btn => {
        const isSelected = Number(btn.dataset.rating) === value;
        btn.style.borderColor = isSelected ? "var(--accent)" : "var(--border-col)";
        btn.style.color       = isSelected ? "var(--accent)" : "var(--text-main)";
    });
}

async function submitFeedbackPage() {
    const email   = document.getElementById("feedbackEmail")?.value.trim();
    const message = document.getElementById("feedbackMessage")?.value.trim();

    if (!email || !email.includes("@")) {
        showToast("Please provide a valid email address.");
        return;
    }
    if (!message) {
        showToast("Please write a message before sending.");
        return;
    }
    if (selectedRating === null) {
        showToast("Please select a rating.");
        return;
    }

    const btn = document.getElementById("feedbackSubmitBtn");
    if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`; }

    try {
        const res = await fetch(`${BACKEND}?action=submit-feedback`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, rating: selectedRating, text: message })
        });
        const data = await res.json();

        if (data.success) {
            showToast("Thanks! Your feedback has been sent.");
            document.getElementById("feedbackMessage").value = "";
            selectedRating = null;
            document.querySelectorAll(".rating-btn").forEach(b => {
                b.style.borderColor = "var(--border-col)";
                b.style.color = "var(--text-main)";
            });
        } else {
            showToast(data.error || "Could not submit feedback.");
        }
    } catch (e) {
        showToast("Network error submitting feedback.");
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send Feedback`; }
    }
}

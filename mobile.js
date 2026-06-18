/* ═══════════════════════════════════════════════════════
   ORION HUB — mobile.js
   Injects mobile bottom nav bar, history drawer, and
   touch-friendly interactions.
   Add <script src="mobile.js"></script> at end of <body>,
   AFTER script.js.
   ═══════════════════════════════════════════════════════ */

(function initMobile() {
  // Only run on mobile viewport
  if (window.innerWidth > 768) return;

  /* ── 1. INJECT BOTTOM NAV BAR ── */
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'mobile-nav-bar';
  bottomNav.id = 'mobileNavBar';
  bottomNav.innerHTML = `
    <button class="mobile-nav-item active" data-tab="startup" onclick="mobileSwitchTab('startup',this)">
      <i class="fa-solid fa-rocket"></i>
      <span>Startup</span>
    </button>
    <button class="mobile-nav-item" data-tab="creator" onclick="mobileSwitchTab('creator',this)">
      <i class="fa-solid fa-clapperboard"></i>
      <span>Creator</span>
    </button>
    <button class="mobile-nav-item" data-tab="marketing" onclick="mobileSwitchTab('marketing',this)">
      <i class="fa-solid fa-bullhorn"></i>
      <span>Marketing</span>
    </button>
    <button class="mobile-nav-item" data-tab="ecom" onclick="mobileSwitchTab('ecom',this)">
      <i class="fa-solid fa-cart-shopping"></i>
      <span>E-Com</span>
    </button>
    <button class="mobile-nav-item mob-history" id="mobileHistoryBtn" onclick="toggleMobileHistory()">
      <i class="fa-solid fa-clock-rotate-left"></i>
      <span>History</span>
    </button>
    <button class="mobile-nav-item mob-settings" id="mobileSettingsBtn" onclick="document.getElementById('openSettingsBtn').click()">
      <i class="fa-solid fa-gear"></i>
      <span>Settings</span>
    </button>
  `;
  document.body.appendChild(bottomNav);

  /* ── 2. INJECT HISTORY DRAWER ── */
  const backdrop = document.createElement('div');
  backdrop.className = 'drawer-backdrop';
  backdrop.id = 'drawerBackdrop';
  backdrop.addEventListener('click', closeHistoryDrawer);
  document.body.appendChild(backdrop);

  const drawer = document.createElement('aside');
  drawer.className = 'mobile-history-drawer';
  drawer.id = 'mobileHistoryDrawer';
  drawer.innerHTML = `
    <div class="drawer-handle"></div>
    <div class="drawer-title">Recent Projects</div>
    <div class="drawer-scroll" id="drawerScroll">
      <div class="history-empty">No history yet.<br>Generate something to get started.</div>
    </div>
  `;
  // Swipe-down to close
  let touchStartY = 0;
  drawer.addEventListener('touchstart', e => { touchStartY = e.touches[0].clientY; }, { passive: true });
  drawer.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientY - touchStartY;
    if (delta > 60) closeHistoryDrawer();
  }, { passive: true });
  document.body.appendChild(drawer);

  /* ── 3. TAB SWITCH ── */
  window.mobileSwitchTab = function(tabId, btn) {
    // Update desktop switcher too
    if (typeof switchTab === 'function') switchTab(tabId);
    // Update mobile nav active state
    document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    // Scroll to top
    document.getElementById('mainContent')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── 4. HISTORY DRAWER TOGGLE ── */
  let historyOpen = false;

  window.toggleMobileHistory = function() {
    historyOpen ? closeHistoryDrawer() : openHistoryDrawer();
  };

  function openHistoryDrawer() {
    historyOpen = true;
    // Sync content from main history panel
    syncDrawerHistory();
    drawer.classList.add('open');
    backdrop.classList.add('visible');
    document.getElementById('mobileHistoryBtn')?.classList.add('active');
  }

  function closeHistoryDrawer() {
    historyOpen = false;
    drawer.classList.remove('open');
    backdrop.classList.remove('visible');
    document.getElementById('mobileHistoryBtn')?.classList.remove('active');
  }
  window.closeHistoryDrawer = closeHistoryDrawer;

  function syncDrawerHistory() {
    const src = document.getElementById('historyScroll');
    const dest = document.getElementById('drawerScroll');
    if (src && dest) dest.innerHTML = src.innerHTML;
  }

  /* ── 5. KEEP DRAWER IN SYNC with renderHistory ── */
  // Patch renderHistory so drawer updates when new items appear
  const _origRender = window.renderHistory;
  window.renderHistory = function() {
    if (typeof _origRender === 'function') _origRender();
    if (historyOpen) syncDrawerHistory();
  };

  /* ── 6. MODAL SHEET DRAG TO CLOSE ── */
  const settingsOverlay = document.getElementById('settingsOverlay');
  if (settingsOverlay) {
    let sheetStartY = 0, sheetModal = null;
    settingsOverlay.addEventListener('touchstart', e => {
      sheetModal = settingsOverlay.querySelector('.modal');
      if (!sheetModal) return;
      const rect = sheetModal.getBoundingClientRect();
      // Only allow drag if touching the top 48px of the modal
      if (e.touches[0].clientY - rect.top < 48) {
        sheetStartY = e.touches[0].clientY;
      } else {
        sheetStartY = 0;
      }
    }, { passive: true });
    settingsOverlay.addEventListener('touchend', e => {
      if (!sheetStartY) return;
      const delta = e.changedTouches[0].clientY - sheetStartY;
      if (delta > 80) {
        settingsOverlay.classList.remove('visible');
        sheetStartY = 0;
      }
    }, { passive: true });
  }

  /* ── 7. SMOOTH SCROLL TO OUTPUT after generate ── */
  const _origGenMobile = window.generateSolution;
  window.generateSolution = async function() {
    if (typeof _origGenMobile === 'function') await _origGenMobile();
    const outputSection = document.getElementById('outputBox')?.closest('.panel');
    if (outputSection) {
      setTimeout(() => {
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  /* ── 8. SAFE AREA PADDING for notch devices ── */
  document.documentElement.style.setProperty(
    '--safe-bottom', 'env(safe-area-inset-bottom, 0px)'
  );

  /* ── 9. SYNC active tab on desktop switchTab calls ── */
  const _origSwitchTab = window.switchTab;
  window.switchTab = function(tabId) {
    if (typeof _origSwitchTab === 'function') _origSwitchTab(tabId);
    document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabId);
    });
  };

})();

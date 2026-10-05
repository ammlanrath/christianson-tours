/**
 * Christianson Tours — Commercial Demonstration & Legal Gate System
 * Developed by Ammlan Rath for Christianson Tours
 * 
 * Enforces:
 * 1. Legal Attribution & Commercial License Gate Modal
 * 2. Supabase-Backed 7-Day Expiration Check
 */

(function () {
  document.addEventListener('DOMContentLoaded', async () => {
    // 1. Check Server Demo Status
    let isExpired = false;
    let demoConfig = {
      client_name: 'Christianson Tours',
      developer_name: 'Ammlan Rath',
      days_remaining: 7
    };

    try {
      const res = await fetch('/api/demo-status');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'EXPIRED' || data.expired === true) {
          isExpired = true;
        }
        if (data.config) {
          demoConfig = { ...demoConfig, ...data.config };
        }
      }
    } catch (e) {
      console.warn('[Demo System] Offline fallback mode active.');
    }

    // 2. If Expired, Show Permanent Expired Gate Page
    if (isExpired) {
      renderExpiredGate(demoConfig);
      return;
    }

    // 3. If Active & Not yet entered in session, Show Legal Gate Modal
    const hasEntered = sessionStorage.getItem('christianson_demo_entered') === 'true';
    if (!hasEntered) {
      renderLegalGateModal(demoConfig);
    }
  });

  function renderLegalGateModal(config) {
    const backdrop = document.createElement('div');
    backdrop.id = 'demo-legal-gate-modal';
    backdrop.className = 'fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl transition-all duration-500 opacity-0 pointer-events-auto';
    
    backdrop.innerHTML = `
      <div class="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl text-slate-100 font-sans overflow-hidden transform scale-95 transition-all duration-300" id="demo-modal-card">
        <!-- Ambient Warm Glow -->
        <div class="absolute -top-24 -right-24 w-60 h-60 bg-amber-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-24 -left-24 w-60 h-60 bg-brand-terracotta/20 rounded-full blur-3xl pointer-events-none"></div>

        <!-- Header Badge -->
        <div class="flex items-center justify-between mb-6">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span class="w-2 h-2 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
            Commercial Demonstration Notice
          </span>
          <span class="text-xs text-slate-400 font-medium">Evaluation Period Active</span>
        </div>

        <!-- Title & Subtitle -->
        <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Christianson Tours Platform Demo
        </h2>
        <p class="text-sm text-slate-300 font-medium mb-6 leading-relaxed">
          Developed by <strong class="text-amber-300 font-semibold">${config.developer_name}</strong> &bull; Presented to <strong class="text-white font-semibold">${config.client_name}</strong>
        </p>

        <!-- Terms & Legal Disclosures Box -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-8 text-xs text-slate-300 space-y-3 leading-relaxed shadow-inner max-h-56 overflow-y-auto custom-scrollbar">
          <div class="flex items-start space-x-2">
            <span class="text-amber-400 font-bold font-mono mt-0.5">&bull;</span>
            <p><strong class="text-slate-100">Client Property:</strong> Client-owned trademarks, logos, business information, photographs, and supplied materials remain the property of their respective owners.</p>
          </div>
          <div class="flex items-start space-x-2">
            <span class="text-amber-400 font-bold font-mono mt-0.5">&bull;</span>
            <p><strong class="text-slate-100">Developer Intellectual Property:</strong> Original website design, software architecture, custom animations, and creative implementation created by <strong>Ammlan Rath</strong> remain the developer's intellectual property unless separately transferred or licensed.</p>
          </div>
          <div class="flex items-start space-x-2">
            <span class="text-amber-400 font-bold font-mono mt-0.5">&bull;</span>
            <p><strong class="text-slate-100">Commercial License & Scope:</strong> This is a paid commercial demonstration website provided strictly for evaluation purposes.</p>
          </div>
          <div class="flex items-start space-x-2">
            <span class="text-amber-400 font-bold font-mono mt-0.5">&bull;</span>
            <p><strong class="text-slate-100">7-Day Expiration:</strong> Access to this live interactive demonstration is temporary and will automatically expire after 7 days from setup.</p>
          </div>
        </div>

        <!-- Action Button -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-xs text-slate-400 text-center sm:text-left">
            Pressing enter opens full interactive evaluation.
          </div>
          <button id="btn-enter-demo" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-brand-terracotta text-slate-950 font-extrabold text-sm uppercase tracking-wider shadow-xl hover:brightness-110 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2">
            <span>ENTER DEMONSTRATION</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Animate in
    requestAnimationFrame(() => {
      backdrop.classList.remove('opacity-0');
      const card = document.getElementById('demo-modal-card');
      if (card) card.classList.remove('scale-95');
    });

    document.getElementById('btn-enter-demo').addEventListener('click', () => {
      sessionStorage.setItem('christianson_demo_entered', 'true');
      backdrop.classList.add('opacity-0');
      setTimeout(() => backdrop.remove(), 400);
    });
  }

  function renderExpiredGate(config) {
    document.body.innerHTML = `
      <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <!-- Ambient Glow -->
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div class="relative max-w-xl w-full bg-slate-900/90 border border-red-500/30 rounded-3xl p-10 shadow-2xl text-center backdrop-blur-xl">
          <div class="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-400">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>

          <span class="inline-block px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/30 mb-4">
            Evaluation Period Expired
          </span>

          <h1 class="text-3xl font-extrabold text-white tracking-tight mb-3">
            Demonstration Period Ended
          </h1>

          <p class="text-slate-300 text-sm leading-relaxed mb-6">
            The 7-day evaluation period for this commercial demonstration of <strong class="text-white">${config.client_name}</strong> has concluded.
          </p>

          <div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-left mb-8 space-y-3 text-xs text-slate-400">
            <p><strong class="text-slate-200">Developer & Architect:</strong> ${config.developer_name}</p>
            <p><strong class="text-slate-200">Client Organization:</strong> ${config.client_name}</p>
            <p><strong class="text-slate-200">Status:</strong> Commercial Demo Expired</p>
          </div>

          <div class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 mb-8">
            To purchase, license, or reactivate this website platform, please contact the developer directly.
          </div>

          <a href="mailto:ammlanrath@gmail.com?subject=Christianson%20Tours%20Website%20Licensing%20Inquiry" class="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-brand-terracotta text-slate-950 font-extrabold text-sm uppercase tracking-wider shadow-lg hover:brightness-110 transition-all cursor-pointer">
            Contact Developer (Ammlan Rath)
          </a>
        </div>
      </div>
    `;
  }
})();

/* ============================================
   RUPTURA ECONOMIC EXPERIENCE — econ.js
   Loads content.json, populates DOM, handles
   form submission, API calls, animations,
   download/share, and Phase 3 interactions.
   ============================================ */

(function () {
  'use strict';

  // ------------------------------------
  // STATE
  // ------------------------------------
  let content = null;       // loaded from content.json
  let resultsData = null;   // aggregated API responses
  let formValues = {};      // raw form values at submit time
  let frequencyIndex = 0;   // 0=Hourly, 1=Monthly, 2=Annual
  let html2canvasLoaded = false;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Progressive commitment ladder state
  var commitmentState = { download: false, share: false, negotiate: false };

  const FREQUENCY_MAP = ['hourly', 'monthly', 'annual'];

  // SVG icon templates for cost translator
  var COST_ICONS = {
    rent: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    food: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    healthcare: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>'
  };

  var COST_LABELS = {
    rent: 'rent',
    food: 'groceries',
    healthcare: 'healthcare'
  };

  // ------------------------------------
  // INIT
  // ------------------------------------
  async function init() {
    try {
      const resp = await fetch('content.json');
      content = await resp.json();
    } catch (e) {
      console.error('Failed to load content.json', e);
      return;
    }
    applyMeta();
    renderOpening();
    renderForm();
    renderLoadingAndError();
    renderResultsShell();
    renderPhase3aShell();
    renderPhase3bShell();
    renderPhase3cShell();
    renderPhase3dShell();
    renderDownloadCard();
    bindEvents();
    initScrollObserver();
  }

  document.addEventListener('DOMContentLoaded', init);

  // ------------------------------------
  // META
  // ------------------------------------
  function applyMeta() {
    document.title = content.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', content.meta.description);
  }

  // ------------------------------------
  // OPENING STATEMENT
  // ------------------------------------
  function renderOpening() {
    const container = document.getElementById('opening');
    content.opening.lines.forEach((line, i) => {
      if (line.type === 'pause') {
        const div = document.createElement('div');
        div.className = 'visual-pause';
        div.setAttribute('aria-hidden', 'true');
        container.appendChild(div);
        return;
      }
      const p = document.createElement('p');
      p.className = 'opening-line';
      p.setAttribute('data-index', i);
      if (line.type === 'welcome') p.classList.add('opening-welcome');
      if (line.type === 'prompt') p.classList.add('opening-prompt');
      p.textContent = line.text;
      container.appendChild(p);
    });
  }

  // ------------------------------------
  // FORM
  // ------------------------------------
  function renderForm() {
    const fields = content.form.fields;

    Object.keys(fields).forEach(key => {
      const labelEl = document.querySelector('[data-label="' + key + '"]');
      if (labelEl) labelEl.textContent = fields[key].label;

      const inputEl = document.getElementById(key);
      if (inputEl && fields[key].placeholder) {
        inputEl.setAttribute('placeholder', fields[key].placeholder);
      }

      const errorEl = document.querySelector('[data-error="' + key + '"]');
      if (errorEl) errorEl.textContent = fields[key].error;
    });

    // Pay frequency toggle buttons
    const toggle = document.querySelector('.frequency-toggle');
    const options = fields.frequency.options;
    options.forEach((label, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'frequency-option' + (i === 0 ? ' active' : '');
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
      btn.textContent = label;
      btn.addEventListener('click', () => setFrequency(i));
      toggle.appendChild(btn);
    });

    document.getElementById('submit-btn').textContent = content.form.submit_text;

    var privacyText = document.getElementById('privacy-note-text');
    if (privacyText) privacyText.textContent = content.form.privacy_note;
  }

  function setFrequency(index) {
    frequencyIndex = index;
    const slider = document.querySelector('.frequency-slider');
    slider.setAttribute('data-pos', index);
    document.querySelectorAll('.frequency-option').forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
      btn.setAttribute('aria-checked', i === index ? 'true' : 'false');
    });
  }

  // ------------------------------------
  // LOADING / ERROR
  // ------------------------------------
  function renderLoadingAndError() {
    document.getElementById('loading-text').textContent = content.loading.text;
    document.getElementById('error-heading').textContent = content.error.heading;
    document.getElementById('error-body').textContent = content.error.body;
    document.getElementById('retry-btn').textContent = content.error.button;
  }

  // ------------------------------------
  // RESULTS CARD SHELL
  // ------------------------------------
  function renderResultsShell() {
    document.getElementById('card-label').textContent = content.results.card_label;
    document.getElementById('card-url').textContent = content.results.card_url;
    document.getElementById('download-btn-text').textContent = content.results.download_text;
    document.getElementById('share-btn-text').textContent = content.results.share_text;
    document.getElementById('breakdown-trigger-text').textContent = content.results.breakdown_trigger;
    document.getElementById('methodology-trigger-text').textContent = content.results.methodology_trigger;
  }

  // ------------------------------------
  // PHASE 3A SHELL — stat cards
  // ------------------------------------
  function renderPhase3aShell() {
    const container = document.getElementById('stat-cards-container');
    content.phase3a.stats.forEach(stat => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML =
        '<span class="stat-highlight">' + escapeHtml(stat.number) + '</span>' +
        '<p class="stat-text">' + escapeHtml(stat.text) + '</p>' +
        '<small class="source">' + escapeHtml(stat.source) + '</small>';
      container.appendChild(card);
    });
    document.getElementById('reframe-statement').textContent = content.phase3a.reframe;
  }

  // ------------------------------------
  // PHASE 3B SHELL — validation blocks
  // ------------------------------------
  function renderPhase3bShell() {
    const container = document.getElementById('validation-container');
    content.phase3b.blocks.forEach(block => {
      const div = document.createElement('div');
      div.className = 'validation-block';
      div.innerHTML =
        '<p class="validation-question">' + escapeHtml(block.question) + '</p>' +
        '<p class="validation-answer">' + escapeHtml(block.answer) + '</p>';
      container.appendChild(div);
    });
  }

  // ------------------------------------
  // PHASE 3C SHELL
  // ------------------------------------
  function renderPhase3cShell() {
    document.getElementById('raise-heading').textContent = content.phase3c.raise_heading;
    document.getElementById('bar-label-current').textContent = content.phase3c.bar_labels.current;
    document.getElementById('bar-label-projected').textContent = content.phase3c.bar_labels.projected;

    const projContainer = document.getElementById('projection-cards');
    content.phase3c.projection_periods.forEach(period => {
      const card = document.createElement('div');
      card.className = 'projection-card';
      card.innerHTML =
        '<div class="projection-period">' + escapeHtml(period) + '</div>' +
        '<div class="projection-value" data-period="' + escapeHtml(period) + '">--</div>';
      projContainer.appendChild(card);
    });

    document.getElementById('wins-heading').textContent = content.phase3c.wins_heading;
    const winsContainer = document.getElementById('wins-container');
    content.phase3c.wins.forEach(win => {
      const card = document.createElement('div');
      card.className = 'win-card';
      card.innerHTML =
        '<p class="win-text">' + escapeHtml(win.text) + '</p>' +
        '<small class="source">' + escapeHtml(win.source) + '</small>';
      winsContainer.appendChild(card);
    });
  }

  // ------------------------------------
  // PHASE 3D SHELL — Progressive Commitment Ladder
  // ------------------------------------
  function renderPhase3dShell() {
    var d = content.phase3d;
    document.getElementById('action-heading').textContent = d.heading;

    var phase3dSection = document.getElementById('phase3d');
    var closingLine = document.getElementById('closing-line');

    var ladder = document.createElement('div');
    ladder.className = 'commitment-ladder';
    ladder.id = 'commitment-ladder';

    // Step 1: Save Your Numbers (Download)
    var step1 = createCommitmentStep(1, 'Save Your Numbers', 'download');
    var downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-primary btn-full-width';
    downloadBtn.id = 'ladder-download-btn';
    downloadBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>' +
      '<span>' + escapeHtml(content.results.download_text) + '</span>';
    step1.querySelector('.step-content').appendChild(downloadBtn);
    ladder.appendChild(step1);

    // Step 2: Show Someone (Share)
    var step2 = createCommitmentStep(2, 'Show Someone', 'share');
    var shareBtn = document.createElement('button');
    shareBtn.className = 'btn-secondary btn-full-width';
    shareBtn.id = 'share-btn-bottom';
    shareBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>' +
      '<span id="share-bottom-text">' + escapeHtml(d.share.button) + '</span>';
    var shareDesc = document.createElement('p');
    shareDesc.className = 'action-description';
    shareDesc.textContent = d.share.description;
    step2.querySelector('.step-content').appendChild(shareBtn);
    step2.querySelector('.step-content').appendChild(shareDesc);
    ladder.appendChild(step2);

    // Step 3: Get Your Script (Negotiation)
    var step3 = createCommitmentStep(3, 'Get Your Script', 'negotiate');
    var negBtn = document.createElement('button');
    negBtn.className = 'btn-primary btn-full-width';
    negBtn.id = 'negotiation-btn';
    negBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>' +
      '<span id="negotiation-btn-text">' + escapeHtml(d.negotiation.button) + '</span>';
    var negDesc = document.createElement('p');
    negDesc.className = 'action-description';
    negDesc.textContent = d.negotiation.description;
    var scriptContent = document.createElement('div');
    scriptContent.className = 'script-content';
    scriptContent.id = 'script-content';
    var scriptInner = document.createElement('div');
    scriptInner.className = 'script-inner';
    scriptInner.id = 'script-inner';
    scriptContent.appendChild(scriptInner);
    step3.querySelector('.step-content').appendChild(negBtn);
    step3.querySelector('.step-content').appendChild(negDesc);
    step3.querySelector('.step-content').appendChild(scriptContent);
    ladder.appendChild(step3);

    // Step 4: Talk to Workers (Forum — coming soon)
    var step4 = createCommitmentStep(4, 'Talk to Workers', 'forum');
    var forumCard = document.createElement('div');
    forumCard.className = 'forum-card';
    forumCard.innerHTML =
      '<h3 class="forum-heading">' + escapeHtml(d.forum.heading) + '</h3>' +
      '<p class="forum-body">' + escapeHtml(d.forum.body) + '</p>';
    var forumBtn = document.createElement('button');
    forumBtn.className = 'btn-primary btn-inline-link btn-disabled';
    forumBtn.textContent = d.forum.button;
    forumBtn.disabled = true;
    forumCard.appendChild(forumBtn);
    step4.querySelector('.step-content').appendChild(forumCard);
    ladder.appendChild(step4);

    // Insert ladder before closing line
    if (closingLine) {
      closingLine.textContent = d.closing;
      phase3dSection.insertBefore(ladder, closingLine);
    } else {
      phase3dSection.appendChild(ladder);
    }
  }

  function createCommitmentStep(number, label, key) {
    var step = document.createElement('div');
    step.className = 'commitment-step';
    step.setAttribute('data-step', key);

    var indicator = document.createElement('div');
    indicator.className = 'step-indicator';
    indicator.id = 'step-indicator-' + key;
    indicator.textContent = number;

    var body = document.createElement('div');
    body.className = 'step-body';

    var stepLabel = document.createElement('div');
    stepLabel.className = 'step-label';
    stepLabel.textContent = label;

    var stepContent = document.createElement('div');
    stepContent.className = 'step-content';

    body.appendChild(stepLabel);
    body.appendChild(stepContent);
    step.appendChild(indicator);
    step.appendChild(body);
    return step;
  }

  function markStepComplete(key) {
    if (commitmentState[key]) return;
    commitmentState[key] = true;
    var indicator = document.getElementById('step-indicator-' + key);
    if (indicator) {
      indicator.classList.add('step-complete');
      indicator.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      // Mark the whole step row for visual cascade
      var step = indicator.closest('.commitment-step');
      if (step) step.classList.add('step-completed');
    }
  }

  // ------------------------------------
  // DOWNLOAD CARD RENDER TARGET
  // ------------------------------------
  function renderDownloadCard() {
    const dc = content.download_card;
    document.getElementById('dl-header').textContent = dc.header;
    document.getElementById('dl-url').textContent = dc.url;
    document.getElementById('dl-tagline').textContent = dc.tagline;
    document.getElementById('dl-watermark').textContent = dc.watermark;
  }

  // ------------------------------------
  // EVENTS
  // ------------------------------------
  function bindEvents() {
    document.getElementById('worker-form').addEventListener('submit', handleSubmit);
    document.getElementById('retry-btn').addEventListener('click', handleRetry);
    document.getElementById('download-btn').addEventListener('click', handleDownload);
    document.getElementById('share-btn').addEventListener('click', handleShare);
    document.getElementById('breakdown-trigger').addEventListener('click', toggleBreakdown);

    // Ladder buttons (created dynamically)
    var ladderDownloadBtn = document.getElementById('ladder-download-btn');
    if (ladderDownloadBtn) ladderDownloadBtn.addEventListener('click', handleDownload);

    var shareBtnBottom = document.getElementById('share-btn-bottom');
    if (shareBtnBottom) shareBtnBottom.addEventListener('click', handleShare);

    document.getElementById('negotiation-btn').addEventListener('click', handleNegotiation);

    document.getElementById('methodology-trigger').addEventListener('click', function() {
      var methodContent = document.getElementById('methodology-content');
      var expanded = this.classList.toggle('expanded');
      methodContent.classList.toggle('expanded');
      this.setAttribute('aria-expanded', expanded);
    });

    // Privacy expandable toggle
    document.getElementById('privacy-trigger').addEventListener('click', function() {
      var detail = document.getElementById('privacy-detail');
      var expanded = this.classList.toggle('expanded');
      detail.classList.toggle('expanded');
      this.setAttribute('aria-expanded', expanded);
    });

    // Sticky bar buttons
    document.getElementById('sticky-share-btn').addEventListener('click', handleShare);
    document.getElementById('sticky-script-btn').addEventListener('click', handleNegotiation);

    ['current_wage', 'start_salary', 'current_rent'].forEach(id => {
      document.getElementById(id).addEventListener('input', formatCurrencyInput);
    });
  }

  // ------------------------------------
  // CURRENCY INPUT FORMATTING
  // ------------------------------------
  function formatCurrencyInput(e) {
    const input = e.target;
    let raw = input.value.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    const intPart = parts[0];
    const decPart = parts.length > 1 ? '.' + parts[1] : '';
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + decPart;
    input.value = formatted;
  }

  function stripCurrency(val) {
    return parseFloat((val || '').replace(/[^0-9.]/g, '')) || 0;
  }

  // ------------------------------------
  // VALIDATION
  // ------------------------------------
  function validateForm() {
    let valid = true;
    const currentYear = new Date().getFullYear();

    const checks = {
      zip_code: v => /^\d{5}$/.test(v),
      current_wage: v => stripCurrency(v) > 0,
      start_salary: v => stripCurrency(v) > 0,
      start_year: v => { const y = parseInt(v); return y >= 1975 && y <= currentYear; },
      current_rent: () => true,
    };

    Object.keys(checks).forEach(key => {
      const input = document.getElementById(key);
      const errEl = document.querySelector('[data-error="' + key + '"]');
      const val = input ? input.value.trim() : '';
      const ok = checks[key](val);
      if (!ok) valid = false;
      if (input) input.classList.toggle('error', !ok);
      if (errEl) errEl.classList.toggle('visible', !ok);
    });

    return valid;
  }

  // ------------------------------------
  // FORM SUBMISSION
  // ------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const btn = document.getElementById('submit-btn');
    const form = document.getElementById('worker-form');

    const currentYear = new Date().getFullYear();
    formValues = {
      zip_code: document.getElementById('zip_code').value.trim(),
      current_wage: stripCurrency(document.getElementById('current_wage').value),
      frequency: FREQUENCY_MAP[frequencyIndex],
      start_salary: stripCurrency(document.getElementById('start_salary').value),
      start_year: parseInt(document.getElementById('start_year').value.trim()),
      current_rent: stripCurrency(document.getElementById('current_rent').value),
    };
    formValues.years_experience = currentYear - formValues.start_year;

    let annualSalary = formValues.current_wage;
    let annualStartSalary = formValues.start_salary;
    if (formValues.frequency === 'hourly') {
      annualSalary = formValues.current_wage * 2080;
      annualStartSalary = formValues.start_salary * 2080;
    } else if (formValues.frequency === 'monthly') {
      annualSalary = formValues.current_wage * 12;
      annualStartSalary = formValues.start_salary * 12;
    }

    btn.textContent = content.form.calculating_text;
    btn.classList.add('calculating');
    btn.disabled = true;
    form.classList.add('faded');

    document.getElementById('loading').hidden = false;
    document.getElementById('error-state').hidden = true;

    try {
      const minDelay = new Promise(r => setTimeout(r, 1200));

      const [impactRes, worthRes, localRes] = await Promise.all([
        fetchJSON('/api/impact-calculator', {
          method: 'POST',
          body: {
            start_year: formValues.start_year,
            start_salary: annualStartSalary,
            current_salary: annualSalary,
            current_rent: formValues.current_rent,
          }
        }),
        fetchJSON('/api/worth-gap-analyzer', {
          method: 'POST',
          body: {
            current_wage: formValues.current_wage,
            frequency: formValues.frequency,
            zip_code: formValues.zip_code,
            start_year: formValues.start_year,
            years_experience: formValues.years_experience,
          }
        }),
        fetchJSON('/api/local-data/' + encodeURIComponent(formValues.zip_code)),
        minDelay,
      ]);

      resultsData = {
        impact: impactRes,
        worth: worthRes,
        local: localRes,
        formValues: formValues,
        annualSalary: annualSalary,
      };

      document.getElementById('loading').hidden = true;

      // Reset commitment state
      commitmentState = { download: false, share: false, negotiate: false };
      ['download', 'share', 'negotiate'].forEach(function(key, i) {
        var indicator = document.getElementById('step-indicator-' + key);
        if (indicator) {
          indicator.classList.remove('step-complete');
          indicator.textContent = (i + 1).toString();
        }
      });

      ['phase2', 'phase3a', 'phase3b', 'phase3c', 'phase3d'].forEach(id => {
        document.getElementById(id).hidden = false;
      });

      populateResults();
      populatePhase3b();
      populatePhase3c();
      populateDownloadCardData();

      document.getElementById('phase2').scrollIntoView({ behavior: 'smooth' });

      // Staggered reveal: card -> value generated -> wages -> gap -> context
      setTimeout(function() {
        document.getElementById('results-card').classList.add('revealed');
      }, 400);
      setTimeout(function() {
        var vg = document.getElementById('value-generated');
        if (vg && getComputedStyle(vg).display !== 'none') {
          vg.classList.add('revealed');
          countUp(vg, resultsData.impact.summary.total_value_generated);
        }
      }, 700);
      setTimeout(function() {
        var wr = document.getElementById('wages-received');
        if (wr && getComputedStyle(wr).display !== 'none') {
          wr.classList.add('revealed');
          countUp(wr, resultsData.impact.summary.total_wages_received);
        }
      }, 1100);
      setTimeout(function() {
        var hs = document.getElementById('hero-stat');
        hs.classList.add('revealed');
        if (resultsData.impact.summary.cumulative_economic_impact > 1000) {
          countUp(hs, resultsData.impact.summary.cumulative_economic_impact);
        }
      }, 1500);
      setTimeout(function() {
        document.getElementById('hero-context').classList.add('revealed');
        document.getElementById('secondary-stat').classList.add('revealed');
      }, 1900);

      // Initialize sticky bar after reveal
      setTimeout(function() { initStickyBar(); }, 2200);

    } catch (err) {
      console.error('API error:', err);
      document.getElementById('loading').hidden = true;
      document.getElementById('error-state').hidden = false;
    }

    btn.textContent = content.form.submit_text;
    btn.classList.remove('calculating');
    btn.disabled = false;
  }

  // ------------------------------------
  // RETRY
  // ------------------------------------
  function handleRetry() {
    document.getElementById('error-state').hidden = true;
    document.getElementById('worker-form').classList.remove('faded');
    document.getElementById('submit-btn').disabled = false;
  }

  // ------------------------------------
  // POPULATE RESULTS
  // ------------------------------------
  function populateResults() {
    const impact = resultsData.impact;
    const worth = resultsData.worth;
    const cumulative = impact.summary.cumulative_economic_impact;
    const totalGenerated = impact.summary.total_value_generated;
    const totalReceived = impact.summary.total_wages_received;

    const card = document.getElementById('results-card');
    const heroEl = document.getElementById('hero-stat');
    const contextEl = document.getElementById('hero-context');
    const gapClaimEl = document.getElementById('gap-claim');
    const valueGenEl = document.getElementById('value-generated');
    const valueGenCtxEl = document.getElementById('value-generated-context');
    const wagesEl = document.getElementById('wages-received');
    const wagesCtxEl = document.getElementById('wages-received-context');
    const secondaryEl = document.getElementById('secondary-stat');
    const secondaryCtx = document.getElementById('secondary-stat-context');
    const labelEl = document.getElementById('card-label');

    card.classList.remove('outcome-severe', 'outcome-moderate', 'outcome-positive');

    if (cumulative <= 1000) {
      card.classList.add('outcome-positive');
      labelEl.textContent = content.results.edge_case_label;
      valueGenEl.style.display = 'none';
      wagesEl.style.display = 'none';
      valueGenCtxEl.style.display = 'none';
      wagesCtxEl.style.display = 'none';
      gapClaimEl.style.display = 'none';
      heroEl.textContent = content.results.edge_case.hero_text;
      heroEl.classList.add('positive');
      contextEl.textContent = content.results.edge_case.context;
    } else {
      valueGenEl.textContent = formatCurrency(totalGenerated);
      valueGenCtxEl.textContent = content.results.value_generated_context.replace('{{year}}', resultsData.formValues.start_year);
      wagesEl.textContent = formatCurrency(totalReceived);
      wagesCtxEl.textContent = content.results.wages_received_context;
      heroEl.textContent = formatCurrency(cumulative);
      contextEl.textContent = content.results.hero_context_template;
      gapClaimEl.textContent = content.results.gap_claim;

      if (cumulative > 50000) {
        card.classList.add('outcome-severe');
        labelEl.textContent = content.results.severe_label;
      } else {
        card.classList.add('outcome-moderate');
        labelEl.textContent = content.results.card_label;
      }
    }

    if (worth.worthGap && worth.worthGap.annual > 0) {
      secondaryEl.textContent = formatCurrency(worth.worthGap.annual) + '/yr';
      secondaryCtx.textContent = content.results.secondary_context_template;
    } else {
      secondaryEl.textContent = impact.summary.years_of_work_equivalent + ' years';
      secondaryEl.classList.add('gold');
      secondaryCtx.textContent = content.results.unpaid_labor_context;
    }

    populateBreakdown();
    populateMethodology();
    renderCareerTimeline();
  }

  // ------------------------------------
  // BREAKDOWN
  // ------------------------------------
  function populateBreakdown() {
    const inner = document.getElementById('breakdown-inner');
    inner.innerHTML = '';
    const impact = resultsData.impact;
    const worth = resultsData.worth;
    const sections = content.results.breakdown_sections;

    const rows = [
      { label: sections.productivity_gap, value: formatCurrency(impact.summary.unrealized_productivity_gains), note: impact.metrics.gap.detail },
      { label: sections.worth_gap, value: worth.worthGap ? formatCurrency(worth.worthGap.annual) + '/yr' : 'N/A', note: worth.marketData ? 'Market median: ' + formatCurrency(worth.marketData.adjustedMedian * 2080) + '/yr (' + worth.marketData.source + ')' : '' },
      { label: sections.housing_cost, value: impact.metrics.housing.value, note: impact.metrics.housing.detail },
      { label: sections.rent_burden, value: impact.metrics.rent.value, note: impact.metrics.rent.detail },
    ];

    rows.forEach(r => {
      const row = document.createElement('div');
      row.className = 'breakdown-row';
      row.innerHTML =
        '<div class="breakdown-label">' + escapeHtml(r.label) + '</div>' +
        '<div class="breakdown-value">' + escapeHtml(r.value) + '</div>' +
        (r.note ? '<div class="breakdown-note">' + escapeHtml(r.note) + '</div>' : '');
      inner.appendChild(row);
    });
  }

  function toggleBreakdown() {
    const trigger = document.getElementById('breakdown-trigger');
    const contentEl = document.getElementById('breakdown-content');
    const expanded = trigger.classList.toggle('expanded');
    contentEl.classList.toggle('expanded');
    trigger.setAttribute('aria-expanded', expanded);
  }

  // ------------------------------------
  // METHODOLOGY
  // ------------------------------------
  function populateMethodology() {
    const inner = document.getElementById('methodology-inner');
    if (!inner) return;
    inner.innerHTML = '';
    const m = resultsData.impact.methodology;
    if (!m) return;

    var mLabels = content.results.methodology_labels;
    var formulaDiv = document.createElement('div');
    formulaDiv.className = 'formula-block';
    formulaDiv.innerHTML =
      '<div class="formula-label">' + escapeHtml(mLabels.fair_value) + '</div>' +
      '<div class="formula-code">' + escapeHtml(m.fair_value_formula) + '</div>' +
      '<div class="formula-example">' + escapeHtml(m.interpolation) + '</div>';
    inner.appendChild(formulaDiv);

    var assumDiv = document.createElement('div');
    assumDiv.className = 'formula-block';
    assumDiv.innerHTML = '<div class="formula-label">' + escapeHtml(mLabels.assumptions) + '</div>';
    [m.seniority_model, m.work_year, m.rent_burden].forEach(function(a) {
      var p = document.createElement('div');
      p.className = 'assumption-item';
      p.textContent = a;
      assumDiv.appendChild(p);
    });
    inner.appendChild(assumDiv);

    var srcDiv = document.createElement('div');
    srcDiv.innerHTML = '<div class="formula-label">' + escapeHtml(mLabels.sources) + '</div>';
    m.sources.forEach(function(s) {
      var a = document.createElement('a');
      a.className = 'source-link';
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = s.name + ' \u2014 ' + s.type;
      srcDiv.appendChild(a);
    });
    inner.appendChild(srcDiv);
  }

  // ------------------------------------
  // PHASE 3B — personalized data
  // ------------------------------------
  function populatePhase3b() {
    const answers = document.querySelectorAll('#validation-container .validation-answer');
    const worth = resultsData.worth;
    const impact = resultsData.impact;

    const replacements = {
      '{{worth_gap_annual}}': worth.worthGap ? formatCurrency(worth.worthGap.annual) : '$0',
      '{{total_productivity_growth}}': impact.metrics.productivity.value,
      '{{total_wage_growth}}': impact.metrics.wages.value,
    };

    answers.forEach(el => {
      let text = el.textContent;
      Object.keys(replacements).forEach(token => {
        text = text.replace(token, replacements[token]);
      });
      el.textContent = text;
    });
  }

  // ------------------------------------
  // PHASE 3C — raise visualization
  // ------------------------------------
  function populatePhase3c() {
    const annual = resultsData.annualSalary;
    const worth = resultsData.worth;
    const gapAnnual = worth.worthGap ? worth.worthGap.annual : 0;
    const halfGap = gapAnnual / 2;
    const projected = annual + halfGap;
    const maxVal = Math.max(annual, projected);

    document.getElementById('bar-current').style.width = (annual / maxVal * 80) + '%';
    document.getElementById('bar-projected').style.width = (projected / maxVal * 80) + '%';
    document.getElementById('bar-value-current').textContent = formatCurrency(annual);
    document.getElementById('bar-value-projected').textContent = formatCurrency(projected);
    document.getElementById('bar-difference').textContent = content.results.bar_difference_template.replace('{{amount}}', formatCurrency(halfGap));

    const periods = content.phase3c.projection_periods;
    const multipliers = [1, 5, 10];
    periods.forEach((period, i) => {
      const el = document.querySelector('[data-period="' + period + '"]');
      if (el) el.textContent = '+' + formatCurrency(halfGap * multipliers[i]);
    });

    const monthlyRent = resultsData.formValues.current_rent;
    if (monthlyRent > 0) {
      const months = Math.floor(halfGap / monthlyRent);
      document.getElementById('context-line').textContent =
        content.results.context_rent_template.replace('{{months}}', months);
    } else {
      const groceryMonths = Math.floor(halfGap / 400);
      document.getElementById('context-line').textContent =
        content.results.context_grocery_template.replace('{{months}}', groceryMonths);
    }

    renderCostTranslator();
    renderUrgencyChart();
  }

  // ============================================
  // COST TRANSLATOR VISUALIZATION
  // ============================================
  function renderCostTranslator() {
    var local = resultsData.local;
    if (!local || (!local.rent && !local.food && !local.healthcare)) return;

    var gapAnnual = resultsData.worth.worthGap ? resultsData.worth.worthGap.annual : 0;
    if (gapAnnual <= 0) return;

    var costData = { rent: local.rent || 0, food: local.food || 0, healthcare: local.healthcare || 0 };
    var activeTab = 'rent';
    var container = document.getElementById('cost-translator');
    var iconGrid = document.getElementById('cost-icon-grid');
    var summary = document.getElementById('cost-summary');
    var tabs = container.querySelectorAll('.cost-tab');
    var slider = container.querySelector('.cost-slider');

    function updateDisplay(category) {
      activeTab = category;
      var monthlyCost = costData[category];
      var monthsCovered = monthlyCost > 0 ? Math.min(12, Math.floor(gapAnnual / monthlyCost)) : 0;

      iconGrid.innerHTML = '';
      for (var i = 0; i < 12; i++) {
        var iconDiv = document.createElement('div');
        iconDiv.className = 'cost-icon ' + (i < monthsCovered ? 'filled' : 'empty');
        iconDiv.innerHTML = COST_ICONS[category];
        iconGrid.appendChild(iconDiv);
      }

      summary.innerHTML = 'Your gap covers <span class="cost-highlight">' +
        monthsCovered + ' month' + (monthsCovered !== 1 ? 's' : '') +
        '</span> of ' + COST_LABELS[category] + ' per year.';

      if (!prefersReducedMotion) {
        var icons = iconGrid.querySelectorAll('.cost-icon');
        icons.forEach(function(icon, idx) {
          setTimeout(function() { icon.classList.add('revealed'); }, idx * 80);
        });
      } else {
        iconGrid.querySelectorAll('.cost-icon').forEach(function(icon) { icon.classList.add('revealed'); });
      }

      tabs.forEach(function(tab, idx) {
        var isActive = tab.getAttribute('data-tab') === category;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        if (isActive) slider.setAttribute('data-pos', idx);
      });
    }

    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() { updateDisplay(this.getAttribute('data-tab')); });
    });

    updateDisplay('rent');
    container.hidden = false;

    var costObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          updateDisplay(activeTab);
          costObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    costObserver.observe(iconGrid);
  }

  // ============================================
  // CAREER TIMELINE VISUALIZATION
  // ============================================
  function renderCareerTimeline() {
    var breakdown = resultsData.impact.yearly_breakdown;
    if (!breakdown || breakdown.length === 0) return;

    var section = document.getElementById('career-timeline-section');
    var trigger = document.getElementById('career-timeline-trigger');
    var contentEl = document.getElementById('career-timeline-content');
    var timeline = document.getElementById('career-timeline');

    timeline.innerHTML = '';

    var maxFairValue = 0;
    breakdown.forEach(function(entry) {
      if (entry.fair_value > maxFairValue) maxFairValue = entry.fair_value;
    });
    if (maxFairValue === 0) maxFairValue = 1;

    breakdown.forEach(function(entry) {
      var row = document.createElement('div');
      row.className = 'timeline-row';
      row.tabIndex = 0;

      var yearSpan = document.createElement('span');
      yearSpan.className = 'timeline-year';
      yearSpan.textContent = entry.year;

      var barsDiv = document.createElement('div');
      barsDiv.className = 'timeline-bars';

      var goldBar = document.createElement('div');
      goldBar.className = 'timeline-bar-gold';
      goldBar.style.width = (entry.income / maxFairValue * 100) + '%';

      var gapValue = entry.fair_value - entry.income;
      var redBar = document.createElement('div');
      redBar.className = 'timeline-bar-red';
      redBar.style.width = (Math.max(0, gapValue) / maxFairValue * 100) + '%';

      barsDiv.appendChild(goldBar);
      barsDiv.appendChild(redBar);

      var tooltip = document.createElement('div');
      tooltip.className = 'timeline-tooltip';
      tooltip.textContent = entry.year + ': Earned ' + formatCurrency(entry.income) + ' | Fair value: ' + formatCurrency(entry.fair_value);

      row.appendChild(yearSpan);
      row.appendChild(barsDiv);
      row.appendChild(tooltip);
      timeline.appendChild(row);
    });

    trigger.addEventListener('click', function() {
      var expanded = trigger.classList.toggle('expanded');
      contentEl.classList.toggle('expanded');
      trigger.setAttribute('aria-expanded', expanded);
      if (expanded) revealTimelineRows();
    });

    section.hidden = false;
  }

  function revealTimelineRows() {
    var rows = document.querySelectorAll('#career-timeline .timeline-row');
    if (prefersReducedMotion) {
      rows.forEach(function(row) { row.classList.add('revealed'); });
      return;
    }
    rows.forEach(function(row, idx) {
      setTimeout(function() { row.classList.add('revealed'); }, idx * 40);
    });
  }

  // ============================================
  // STICKY BOTTOM ACTION BAR
  // ============================================
  function initStickyBar() {
    var stickyBar = document.getElementById('sticky-bar');
    var phase3d = document.getElementById('phase3d');
    if (!stickyBar || !phase3d) return;

    stickyBar.hidden = false;

    var stickyObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          stickyBar.classList.remove('visible');
        } else {
          stickyBar.classList.add('visible');
        }
      });
    }, { threshold: 0.5 });

    stickyObserver.observe(phase3d);
  }

  // ============================================
  // COST OF WAITING (URGENCY) CHART
  // ============================================
  function renderUrgencyChart() {
    var lifetimeImpact = resultsData.worth.lifetimeImpact;
    if (!lifetimeImpact || !lifetimeImpact.yearlyProjection || lifetimeImpact.yearlyProjection.length === 0) return;

    var projection = lifetimeImpact.yearlyProjection.slice(0, 20);
    var section = document.getElementById('urgency-section');
    var chartEl = document.getElementById('urgency-chart');
    var calloutsEl = document.getElementById('urgency-callouts');

    chartEl.innerHTML = '';
    calloutsEl.innerHTML = '';

    var maxValue = 0;
    projection.forEach(function(p) {
      var val = Math.max(Math.abs(p.cumulativeLost || 0), Math.abs(p.investmentValue || 0));
      if (val > maxValue) maxValue = val;
    });
    if (maxValue === 0) maxValue = 1;

    var svgWidth = 480, svgHeight = 180;
    var pad = { top: 10, right: 10, bottom: 10, left: 10 };
    var plotW = svgWidth - pad.left - pad.right;
    var plotH = svgHeight - pad.top - pad.bottom;

    var gainPoints = [], lossPoints = [];
    projection.forEach(function(p, i) {
      var x = pad.left + (i / (projection.length - 1 || 1)) * plotW;
      gainPoints.push({ x: x, y: pad.top + plotH - ((p.investmentValue || 0) / maxValue) * plotH });
      lossPoints.push({ x: x, y: pad.top + plotH - ((p.cumulativeLost || 0) / maxValue) * plotH });
    });

    var areaPath = 'M' + gainPoints[0].x + ',' + (pad.top + plotH);
    gainPoints.forEach(function(pt) { areaPath += ' L' + pt.x + ',' + pt.y; });
    areaPath += ' L' + gainPoints[gainPoints.length - 1].x + ',' + (pad.top + plotH) + ' Z';

    var gainLine = 'M' + gainPoints.map(function(pt) { return pt.x + ',' + pt.y; }).join(' L');
    var lossLine = 'M' + lossPoints.map(function(pt) { return pt.x + ',' + pt.y; }).join(' L');

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    var areaGroup = document.createElementNS(svgNS, 'g');
    areaGroup.setAttribute('class', 'urgency-area');

    var areaEl = document.createElementNS(svgNS, 'path');
    areaEl.setAttribute('d', areaPath);
    areaEl.setAttribute('fill', 'var(--accent-gold)');
    areaEl.setAttribute('fill-opacity', '0.3');
    areaGroup.appendChild(areaEl);

    var gainLineEl = document.createElementNS(svgNS, 'path');
    gainLineEl.setAttribute('d', gainLine);
    gainLineEl.setAttribute('fill', 'none');
    gainLineEl.setAttribute('stroke', 'var(--accent-gold)');
    gainLineEl.setAttribute('stroke-width', '2');
    areaGroup.appendChild(gainLineEl);

    var lossLineEl = document.createElementNS(svgNS, 'path');
    lossLineEl.setAttribute('d', lossLine);
    lossLineEl.setAttribute('fill', 'none');
    lossLineEl.setAttribute('stroke', 'var(--gap-red)');
    lossLineEl.setAttribute('stroke-width', '2');
    lossLineEl.setAttribute('stroke-dasharray', '6 4');
    areaGroup.appendChild(lossLineEl);

    svg.appendChild(areaGroup);
    chartEl.appendChild(svg);

    function formatK(val) {
      var abs = Math.abs(val || 0);
      return abs >= 1000 ? '$' + Math.round(abs / 1000) + 'K' : '$' + Math.round(abs);
    }

    var last = projection[projection.length - 1];
    var y1 = projection.length > 1 ? projection[1] : projection[0];
    var y5 = projection.length > 5 ? projection[5] : projection[projection.length - 1];

    var card1 = document.createElement('div');
    card1.className = 'urgency-card act-now';
    card1.innerHTML = '<div class="urgency-card-label">Act now</div><div class="urgency-card-value">+' + formatK(last.investmentValue) + '</div>';
    calloutsEl.appendChild(card1);

    var card2 = document.createElement('div');
    card2.className = 'urgency-card wait';
    card2.innerHTML = '<div class="urgency-card-label">Wait 1 year</div><div class="urgency-card-value">-' + formatK(y1.cumulativeLost) + ' lost</div>';
    calloutsEl.appendChild(card2);

    var card3 = document.createElement('div');
    card3.className = 'urgency-card wait';
    card3.innerHTML = '<div class="urgency-card-label">Wait 5 years</div><div class="urgency-card-value">-' + formatK(y5.cumulativeLost) + ' lost</div>';
    calloutsEl.appendChild(card3);

    section.hidden = false;

    var chartObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          areaGroup.classList.add('revealed');
          chartObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    chartObserver.observe(chartEl);
  }

  // ------------------------------------
  // DOWNLOAD CARD DATA
  // ------------------------------------
  function populateDownloadCardData() {
    const impact = resultsData.impact;
    const cumulative = impact.summary.cumulative_economic_impact;
    document.getElementById('dl-hero').textContent = formatCurrency(cumulative);
    document.getElementById('dl-context').textContent = content.results.hero_context_template;

    const worth = resultsData.worth;
    if (worth.worthGap && worth.worthGap.annual > 0) {
      document.getElementById('dl-secondary').textContent =
        formatCurrency(worth.worthGap.annual) + '/yr ' + content.results.secondary_context_template;
    }
  }

  // ------------------------------------
  // DOWNLOAD
  // ------------------------------------
  async function handleDownload() {
    const btn = document.getElementById('download-btn');
    const textEl = document.getElementById('download-btn-text');

    if (window.RupturaVideoCard && window.RupturaVideoCard.isSupported()) {
      btn.disabled = true;
      textEl.textContent = content.results.download_generating;

      window.RupturaVideoCard.generate(resultsData, content,
        function(p) { textEl.textContent = Math.round(p * 100) + '%'; },
        function() {
          btn.classList.add('btn-success');
          textEl.textContent = content.results.download_success;
          btn.disabled = false;
          markStepComplete('download');
          setTimeout(() => { btn.classList.remove('btn-success'); textEl.textContent = content.results.download_text; }, 1500);
        },
        function(err) {
          console.warn('Video card failed, falling back to PNG:', err);
          btn.disabled = false;
          textEl.textContent = content.results.download_text;
          downloadPNG();
        }
      );
      return;
    }
    downloadPNG();
  }

  async function downloadPNG() {
    const btn = document.getElementById('download-btn');
    const textEl = document.getElementById('download-btn-text');

    if (!html2canvasLoaded) {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      html2canvasLoaded = true;
    }

    try {
      const target = document.getElementById('download-card');
      const canvas = await window.html2canvas(target, { width: 1080, height: 1920, scale: 1, backgroundColor: '#0C0F14', useCORS: true });
      canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ruptura-impact.png';
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');

      btn.classList.add('btn-success');
      textEl.textContent = content.results.download_success;
      markStepComplete('download');
      setTimeout(() => { btn.classList.remove('btn-success'); textEl.textContent = content.results.download_text; }, 1500);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }

  // ------------------------------------
  // SHARE
  // ------------------------------------
  async function handleShare() {
    const url = 'https://econ.ruptura.co';

    if (navigator.share) {
      try {
        await navigator.share({ title: content.meta.title, url: url });
        markStepComplete('share');
      } catch (e) { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        var textEl = this.querySelector('span');
        if (textEl) {
          var original = textEl.textContent;
          textEl.textContent = content.results.share_copied;
          setTimeout(function() { textEl.textContent = original; }, 1500);
        }
        markStepComplete('share');
      } catch (e) {
        console.error('Copy failed', e);
      }
    }
  }

  // ------------------------------------
  // NEGOTIATION SCRIPT
  // ------------------------------------
  async function handleNegotiation() {
    const btn = document.getElementById('negotiation-btn');
    const scriptContent = document.getElementById('script-content');
    const scriptInner = document.getElementById('script-inner');

    if (scriptInner.children.length > 0) {
      scriptContent.classList.toggle('expanded');
      return;
    }

    btn.disabled = true;
    const btnText = document.getElementById('negotiation-btn-text');
    const originalText = btnText.textContent;
    btnText.textContent = content.form.calculating_text;

    try {
      const worth = resultsData.worth;
      const data = await fetchJSON('/api/negotiation-script', {
        method: 'POST',
        body: {
          current_salary: resultsData.formValues.current_wage,
          frequency: resultsData.formValues.frequency,
          market_median: worth.marketData ? worth.marketData.adjustedMedian * 2080 : null,
          years_at_company: resultsData.formValues.years_experience,
        }
      });

      const labels = content.phase3d.negotiation.section_labels;
      const sections = [
        { title: labels.opening, text: data.openingStatement },
        { title: labels.evidence, text: (data.evidenceBullets || []).map(b => '\u2022 ' + b).join('\n') },
        { title: labels.resolution, text: data.resolutionLanguage },
        { title: labels.counters, text: Object.values(data.counterofferResponses || {}).map(v => '\u2022 ' + v).join('\n') },
      ];

      scriptInner.innerHTML = '';
      sections.forEach(s => {
        const div = document.createElement('div');
        div.className = 'script-section';
        div.innerHTML =
          '<div class="script-section-title">' + escapeHtml(s.title) + '</div>' +
          '<div class="script-section-text">' + escapeHtml(s.text).replace(/\n/g, '<br>') + '</div>';
        scriptInner.appendChild(div);
      });

      addSaveScriptButton(scriptInner, sections);
      scriptContent.classList.add('expanded');
      markStepComplete('negotiate');
    } catch (err) {
      console.error('Negotiation script error:', err);
    }

    btnText.textContent = originalText;
    btn.disabled = false;
  }

  // ------------------------------------
  // SAVE SCRIPT (PRINT-FRIENDLY ONE-PAGER)
  // ------------------------------------
  function addSaveScriptButton(container, sections) {
    var saveBtn = document.createElement('button');
    saveBtn.className = 'btn-secondary btn-full-width';
    saveBtn.style.marginTop = '24px';
    saveBtn.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>' +
      '<span>Save Script</span>';

    saveBtn.addEventListener('click', function() {
      var salary = formatCurrency(resultsData.annualSalary);
      var gap = resultsData.worth.worthGap ? formatCurrency(resultsData.worth.worthGap.annual) : '$0';

      var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>Ruptura - Negotiation Script</title><style>' +
        '*{box-sizing:border-box;margin:0;padding:0}' +
        'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1a1a1a;line-height:1.6;max-width:700px;margin:0 auto;padding:40px 24px}' +
        '.header{text-align:center;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #D4A054}' +
        '.header h1{font-size:24px;font-weight:700;margin-bottom:4px}' +
        '.header p{font-size:14px;color:#666}' +
        '.summary{display:flex;gap:16px;margin-bottom:24px}' +
        '.summary-item{flex:1;background:#f8f8f8;border-radius:8px;padding:12px;text-align:center}' +
        '.summary-label{font-size:12px;color:#666;text-transform:uppercase;letter-spacing:0.05em}' +
        '.summary-value{font-size:18px;font-weight:700;margin-top:4px}' +
        '.section{margin-bottom:24px}' +
        '.section-title{font-size:14px;font-weight:600;color:#D4A054;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid #eee}' +
        '.section-text{font-size:15px;color:#333;white-space:pre-wrap}' +
        '.footer{margin-top:32px;padding-top:16px;border-top:1px solid #ddd;text-align:center;font-size:12px;color:#999}' +
        '@media print{body{padding:20px}}' +
        '</style></head><body>' +
        '<div class="header"><h1>Negotiation Script</h1><p>Prepared by Ruptura &mdash; econ.ruptura.co</p></div>' +
        '<div class="summary">' +
        '<div class="summary-item"><div class="summary-label">Current Salary</div><div class="summary-value">' + escapeHtml(salary) + '</div></div>' +
        '<div class="summary-item"><div class="summary-label">Annual Gap</div><div class="summary-value">' + escapeHtml(gap) + '/yr</div></div>' +
        '</div>';

      sections.forEach(function(s) {
        html += '<div class="section"><div class="section-title">' + escapeHtml(s.title) + '</div>' +
          '<div class="section-text">' + escapeHtml(s.text) + '</div></div>';
      });

      html += '<div class="footer">Generated by Ruptura | econ.ruptura.co | Data from BLS &amp; EPI</div>' +
        '<script>setTimeout(function(){window.print()},500)<\/script></body></html>';

      var w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); }
    });

    container.appendChild(saveBtn);
  }

  // ------------------------------------
  // SCROLL OBSERVER
  // ------------------------------------
  function initScrollObserver() {
    const lineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.getAttribute('data-index')) || 0;
          if (!prefersReducedMotion) {
            setTimeout(() => { entry.target.classList.add('visible'); }, idx * 150);
          } else {
            entry.target.classList.add('visible');
          }
          lineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.opening-line').forEach(el => lineObserver.observe(el));

    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    // Staggered observer for commitment ladder steps
    var stepObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var steps = document.querySelectorAll('.commitment-step');
          var idx = Array.prototype.indexOf.call(steps, entry.target);
          var delay = prefersReducedMotion ? 0 : idx * 120;
          setTimeout(function() { entry.target.classList.add('visible'); }, delay);
          stepObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    const mutObs = new MutationObserver(() => {
      document.querySelectorAll('.stat-card:not(.visible), .validation-block:not(.visible), .win-card:not(.visible)').forEach(el => {
        fadeObserver.observe(el);
      });
      document.querySelectorAll('.commitment-step:not(.visible)').forEach(el => {
        stepObserver.observe(el);
      });
    });
    mutObs.observe(document.body, { childList: true, subtree: true, attributes: true });

    document.querySelectorAll('.stat-card, .validation-block, .win-card').forEach(el => {
      fadeObserver.observe(el);
    });
    document.querySelectorAll('.commitment-step').forEach(el => {
      stepObserver.observe(el);
    });

    const reframeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          reframeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    const reframe = document.getElementById('reframe-statement');
    if (reframe) reframeObserver.observe(reframe);
  }

  // ------------------------------------
  // UTILITIES
  // ------------------------------------
  // ------------------------------------
  // COUNT-UP ANIMATION
  // ------------------------------------
  function countUp(element, targetValue, duration) {
    if (!targetValue || targetValue <= 0) return;
    if (prefersReducedMotion) {
      element.textContent = formatCurrency(targetValue);
      return;
    }
    duration = duration || 1200;
    var startTime = null;
    var startValue = 0;
    var target = Math.round(targetValue);

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function tick(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var easedProgress = easeOutCubic(progress);
      var currentValue = Math.round(startValue + (target - startValue) * easedProgress);
      element.textContent = formatCurrency(currentValue);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }

  function formatCurrency(num) {
    if (num == null || isNaN(num)) return '$0';
    const abs = Math.abs(Math.round(num));
    const formatted = abs.toLocaleString('en-US');
    return (num < 0 ? '-$' : '$') + formatted;
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function fetchJSON(url, opts = {}) {
    const config = { headers: { 'Content-Type': 'application/json' } };
    if (opts.method) config.method = opts.method;
    if (opts.body) config.body = JSON.stringify(opts.body);
    const resp = await fetch(url, config);
    if (!resp.ok) throw new Error('API ' + resp.status);
    return resp.json();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
})();

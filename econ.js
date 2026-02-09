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

  const FREQUENCY_MAP = ['hourly', 'monthly', 'annual'];

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

    // Labels and placeholders
    Object.keys(fields).forEach(key => {
      const labelEl = document.querySelector(`[data-label="${key}"]`);
      if (labelEl) labelEl.textContent = fields[key].label;

      const inputEl = document.getElementById(key);
      if (inputEl && fields[key].placeholder) {
        inputEl.setAttribute('placeholder', fields[key].placeholder);
      }

      const errorEl = document.querySelector(`[data-error="${key}"]`);
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

    // Submit button text
    document.getElementById('submit-btn').textContent = content.form.submit_text;
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

    // Projection cards
    const projContainer = document.getElementById('projection-cards');
    content.phase3c.projection_periods.forEach(period => {
      const card = document.createElement('div');
      card.className = 'projection-card';
      card.innerHTML =
        '<div class="projection-period">' + escapeHtml(period) + '</div>' +
        '<div class="projection-value" data-period="' + escapeHtml(period) + '">--</div>';
      projContainer.appendChild(card);
    });

    // Wins
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
  // PHASE 3D SHELL
  // ------------------------------------
  function renderPhase3dShell() {
    const d = content.phase3d;
    document.getElementById('action-heading').textContent = d.heading;
    document.getElementById('share-bottom-text').textContent = d.share.button;
    document.getElementById('share-description').textContent = d.share.description;
    document.getElementById('negotiation-btn-text').textContent = d.negotiation.button;
    document.getElementById('negotiation-description').textContent = d.negotiation.description;
    document.getElementById('forum-heading').textContent = d.forum.heading;
    document.getElementById('forum-body').textContent = d.forum.body;
    const forumBtn = document.getElementById('forum-btn');
    forumBtn.textContent = d.forum.button;
    forumBtn.href = d.forum.url;
    document.getElementById('closing-line').textContent = d.closing;
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
    // Form submit
    document.getElementById('worker-form').addEventListener('submit', handleSubmit);

    // Retry
    document.getElementById('retry-btn').addEventListener('click', handleRetry);

    // Download
    document.getElementById('download-btn').addEventListener('click', handleDownload);

    // Share (top)
    document.getElementById('share-btn').addEventListener('click', handleShare);

    // Breakdown toggle
    document.getElementById('breakdown-trigger').addEventListener('click', toggleBreakdown);

    // Share (bottom)
    document.getElementById('share-btn-bottom').addEventListener('click', handleShare);

    // Negotiation script
    document.getElementById('negotiation-btn').addEventListener('click', handleNegotiation);

    // Salary input formatting
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
    // Allow only one decimal point
    const parts = raw.split('.');
    if (parts.length > 2) raw = parts[0] + '.' + parts.slice(1).join('');
    // Format integer part with commas
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
      current_rent: () => true, // optional field
    };

    Object.keys(checks).forEach(key => {
      const input = document.getElementById(key);
      const errEl = document.querySelector(`[data-error="${key}"]`);
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

    // Collect values
    const currentYear = new Date().getFullYear();
    formValues = {
      zip_code: document.getElementById('zip_code').value.trim(),
      current_wage: stripCurrency(document.getElementById('current_wage').value),
      frequency: FREQUENCY_MAP[frequencyIndex],
      start_salary: stripCurrency(document.getElementById('start_salary').value),
      start_year: parseInt(document.getElementById('start_year').value.trim()),
      current_rent: stripCurrency(document.getElementById('current_rent').value),
    };
    // Derive years_experience from start_year
    formValues.years_experience = currentYear - formValues.start_year;

    // Normalize to annual for impact-calculator
    let annualSalary = formValues.current_wage;
    let annualStartSalary = formValues.start_salary;
    if (formValues.frequency === 'hourly') {
      annualSalary = formValues.current_wage * 2080;
      annualStartSalary = formValues.start_salary * 2080;
    } else if (formValues.frequency === 'monthly') {
      annualSalary = formValues.current_wage * 12;
      annualStartSalary = formValues.start_salary * 12;
    }

    // UI: calculating state
    btn.textContent = content.form.calculating_text;
    btn.classList.add('calculating');
    btn.disabled = true;
    form.classList.add('faded');

    // Show loading
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

      // Hide loading
      document.getElementById('loading').hidden = true;

      // Show all result sections
      ['phase2', 'phase3a', 'phase3b', 'phase3c', 'phase3d'].forEach(id => {
        document.getElementById(id).hidden = false;
      });

      // Populate results
      populateResults();
      populatePhase3b();
      populatePhase3c();
      populateDownloadCardData();

      // Scroll to results
      document.getElementById('phase2').scrollIntoView({ behavior: 'smooth' });

      // Trigger reveal animations with delays
      setTimeout(() => {
        document.getElementById('results-card').classList.add('revealed');
        document.getElementById('hero-stat').classList.add('revealed');
      }, 400);
      setTimeout(() => {
        document.getElementById('hero-context').classList.add('revealed');
        document.getElementById('secondary-stat').classList.add('revealed');
      }, 800);

    } catch (err) {
      console.error('API error:', err);
      document.getElementById('loading').hidden = true;
      document.getElementById('error-state').hidden = false;
    }

    // Reset button
    btn.textContent = content.form.submit_text;
    btn.classList.remove('calculating');
    btn.disabled = false;
  }

  // ------------------------------------
  // RETRY
  // ------------------------------------
  function handleRetry() {
    document.getElementById('error-state').hidden = true;
    const form = document.getElementById('worker-form');
    form.classList.remove('faded');
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

    // Classify outcome and apply tier styling
    if (cumulative <= 1000) {
      card.classList.add('outcome-positive');
      labelEl.textContent = 'YOUR ECONOMIC POSITION';
      // Hide ceremony, show positive message
      valueGenEl.style.display = 'none';
      wagesEl.style.display = 'none';
      valueGenCtxEl.style.display = 'none';
      wagesCtxEl.style.display = 'none';
      gapClaimEl.style.display = 'none';
      heroEl.textContent = content.results.edge_case.hero_text;
      heroEl.classList.add('positive');
      contextEl.textContent = content.results.edge_case.context;
    } else {
      // Value Recognition Ceremony
      valueGenEl.textContent = formatCurrency(totalGenerated);
      valueGenCtxEl.textContent = 'total value you created since ' + resultsData.formValues.start_year;
      wagesEl.textContent = formatCurrency(totalReceived);
      wagesCtxEl.textContent = 'what you were actually paid';

      heroEl.textContent = formatCurrency(cumulative);
      contextEl.textContent = content.results.hero_context_template;
      gapClaimEl.textContent = "That gap is yours. You earned it.";

      if (cumulative > 50000) {
        card.classList.add('outcome-severe');
        labelEl.textContent = 'YOUR ECONOMIC LOSS';
      } else {
        card.classList.add('outcome-moderate');
        labelEl.textContent = content.results.card_label;
      }
    }

    // Secondary stat
    if (worth.worthGap && worth.worthGap.annual > 0) {
      secondaryEl.textContent = formatCurrency(worth.worthGap.annual) + '/yr';
      secondaryCtx.textContent = content.results.secondary_context_template;
    } else {
      secondaryEl.textContent = impact.summary.years_of_work_equivalent + ' years';
      secondaryEl.classList.add('gold');
      secondaryCtx.textContent = 'of equivalent unpaid labor';
    }

    populateBreakdown();
    populateMethodology();
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
      {
        label: sections.productivity_gap,
        value: formatCurrency(impact.summary.unrealized_productivity_gains),
        note: impact.metrics.gap.detail,
      },
      {
        label: sections.worth_gap,
        value: worth.worthGap ? formatCurrency(worth.worthGap.annual) + '/yr' : 'N/A',
        note: worth.marketData ? 'Market median: ' + formatCurrency(worth.marketData.adjustedMedian * 2080) + '/yr (' + worth.marketData.source + ')' : '',
      },
      {
        label: sections.housing_cost,
        value: impact.metrics.housing.value,
        note: impact.metrics.housing.detail,
      },
      {
        label: sections.rent_burden,
        value: impact.metrics.rent.value,
        note: impact.metrics.rent.detail,
      },
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

    // Formula block
    var formulaDiv = document.createElement('div');
    formulaDiv.className = 'formula-block';
    formulaDiv.innerHTML =
      '<div class="formula-label">How We Calculate Fair Value</div>' +
      '<div class="formula-code">' + escapeHtml(m.fair_value_formula) + '</div>' +
      '<div class="formula-example">' + escapeHtml(m.interpolation) + '</div>';
    inner.appendChild(formulaDiv);

    // Assumptions
    var assumDiv = document.createElement('div');
    assumDiv.className = 'formula-block';
    assumDiv.innerHTML = '<div class="formula-label">Assumptions</div>';
    [m.seniority_model, m.work_year, m.rent_burden].forEach(function(a) {
      var p = document.createElement('div');
      p.className = 'assumption-item';
      p.textContent = a;
      assumDiv.appendChild(p);
    });
    inner.appendChild(assumDiv);

    // Sources with links
    var srcDiv = document.createElement('div');
    srcDiv.innerHTML = '<div class="formula-label">Data Sources</div>';
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

    // Bind toggle
    document.getElementById('methodology-trigger').addEventListener('click', function() {
      var methodContent = document.getElementById('methodology-content');
      var expanded = this.classList.toggle('expanded');
      methodContent.classList.toggle('expanded');
      this.setAttribute('aria-expanded', expanded);
    });
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

    // Bar widths
    document.getElementById('bar-current').style.width = (annual / maxVal * 80) + '%';
    document.getElementById('bar-projected').style.width = (projected / maxVal * 80) + '%';
    document.getElementById('bar-value-current').textContent = formatCurrency(annual);
    document.getElementById('bar-value-projected').textContent = formatCurrency(projected);
    document.getElementById('bar-difference').textContent = '+' + formatCurrency(halfGap) + '/year';

    // Projections
    const periods = content.phase3c.projection_periods;
    const multipliers = [1, 5, 10];
    periods.forEach((period, i) => {
      const el = document.querySelector('[data-period="' + period + '"]');
      if (el) el.textContent = '+' + formatCurrency(halfGap * multipliers[i]);
    });

    // Context line
    const monthlyRent = resultsData.formValues.current_rent;
    if (monthlyRent > 0) {
      const months = Math.floor(halfGap / monthlyRent);
      document.getElementById('context-line').textContent =
        "That\u2019s " + months + ' months of rent per year.';
    } else {
      const groceryMonths = Math.floor(halfGap / 400);
      document.getElementById('context-line').textContent =
        "That\u2019s roughly " + groceryMonths + ' months of groceries.';
    }
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
  // DOWNLOAD (video-first with PNG fallback)
  // ------------------------------------
  async function handleDownload() {
    const btn = document.getElementById('download-btn');
    const textEl = document.getElementById('download-btn-text');

    // Try animated video card first
    if (window.RupturaVideoCard && window.RupturaVideoCard.isSupported()) {
      btn.disabled = true;
      textEl.textContent = 'Generating...';

      window.RupturaVideoCard.generate(
        resultsData,
        content,
        function onProgress(p) {
          textEl.textContent = Math.round(p * 100) + '%';
        },
        function onComplete() {
          btn.classList.add('btn-success');
          textEl.textContent = '\u2713';
          btn.disabled = false;
          setTimeout(() => {
            btn.classList.remove('btn-success');
            textEl.textContent = content.results.download_text;
          }, 1500);
        },
        function onError(err) {
          console.warn('Video card failed, falling back to PNG:', err);
          btn.disabled = false;
          textEl.textContent = content.results.download_text;
          downloadPNG();
        }
      );
      return;
    }

    // Fallback: static PNG
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
      const canvas = await window.html2canvas(target, {
        width: 1080,
        height: 1920,
        scale: 1,
        backgroundColor: '#0C0F14',
        useCORS: true,
      });
      canvas.toBlob(function (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ruptura-impact.png';
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');

      btn.classList.add('btn-success');
      textEl.textContent = '\u2713';
      setTimeout(() => {
        btn.classList.remove('btn-success');
        textEl.textContent = content.results.download_text;
      }, 1500);

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
      } catch (e) { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        const textEl = this.querySelector('span');
        const original = textEl.textContent;
        textEl.textContent = content.results.share_copied;
        setTimeout(() => { textEl.textContent = original; }, 1500);
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

    // Toggle if already loaded
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

      scriptContent.classList.add('expanded');
    } catch (err) {
      console.error('Negotiation script error:', err);
    }

    btnText.textContent = originalText;
    btn.disabled = false;
  }

  // ------------------------------------
  // SCROLL OBSERVER
  // ------------------------------------
  function initScrollObserver() {
    // Opening lines
    const lineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.getAttribute('data-index')) || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, idx * 150);
          lineObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.opening-line').forEach(el => lineObserver.observe(el));

    // General fade-up elements (stat cards, validation blocks, win cards)
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    // Use MutationObserver to catch dynamically added elements
    const body = document.body;
    const mutObs = new MutationObserver(() => {
      document.querySelectorAll('.stat-card:not(.visible), .validation-block:not(.visible), .win-card:not(.visible)').forEach(el => {
        fadeObserver.observe(el);
      });
    });
    mutObs.observe(body, { childList: true, subtree: true, attributes: true });

    // Also observe anything already in DOM
    document.querySelectorAll('.stat-card, .validation-block, .win-card').forEach(el => {
      fadeObserver.observe(el);
    });

    // Reframe statement (special: fade only, no translateY)
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

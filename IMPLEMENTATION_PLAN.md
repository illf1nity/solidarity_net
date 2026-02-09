# Ruptura P0 Implementation Plan
## Based on Economic Baller (6.8/10) + Brand Designer (7.2/10) Reviews

**Project:** C:\Users\bentz\Downloads\Ruptura\Ruptura-main
**Target Score:** 8.5+/10 in both domains
**Estimated New/Modified Lines:** ~600

---

## Requirements Restatement

Transform the Ruptura economic experience from a loss-focused calculator into a value-first empowerment tool by implementing 10 P0 fixes identified by two specialized reviews. The core shift: workers should feel **powerful before angry**, see their **generated value before the gap**, and leave with an **actionable negotiation tool** — not just awareness.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Value Recognition Ceremony changes results card HTML structure | HIGH | Keep existing element IDs, ADD new elements above existing ones |
| Removing 2 form fields breaks validation/API calls | HIGH | Derive `years_experience` and `state` from existing inputs; update API payload construction |
| content.json opening rewrite changes `type` field matching | MEDIUM | Current code checks `line.type === 'welcome'` and `line.type === 'prompt'` — new content must use these exact type values |
| Server.js changes to API response structure | MEDIUM | ADD new fields to response (totalValueGenerated, methodology), don't remove existing fields |
| html2canvas rendering after card restructure | LOW | Download card is separate element, changes are isolated |

---

## Implementation Phases

### PHASE 1: Content & Rhetoric Fixes (No Code Logic Changes)
*Files: content.json only*
*Risk: LOW — text-only changes, structure preserved*

#### Step 1A: Rewrite Opening Statement (Impact: 10, Effort: 2)

Replace `content.json` lines 7-24 with value-first sequence. Critical: preserve `type` field values that econ.js checks (`"welcome"`, `"pause"`, `"prompt"`).

**New opening lines:**
```json
"opening": {
  "lines": [
    { "type": "welcome", "text": "Your work creates real value." },
    { "type": "normal", "text": "Every hour you work generates revenue, keeps systems running, helps people." },
    { "type": "normal", "text": "You know this. Your employer knows this." },
    { "type": "normal", "text": "The numbers prove it." },
    { "type": "pause", "text": "" },
    { "type": "normal", "text": "But those who profit from your work have captured the rewards." },
    { "type": "normal", "text": "Wages haven't matched productivity in decades." },
    { "type": "normal", "text": "Rent outpaces income. Surveillance replaces raises." },
    { "type": "pause", "text": "" },
    { "type": "normal", "text": "We built these tools to show you exactly how much value you create." },
    { "type": "prompt", "text": "Enter your numbers below and see the real cost of working for someone else's profit." }
  ]
}
```

**Why:** Establishes power/worth in lines 1-4, pivots to gap in lines 6-8, invites discovery in lines 10-11. Fixes "grief-before-value" anti-pattern. Active voice throughout ("captures" not "are captured").

**Validation:** econ.js `renderOpening()` (line 61-79) checks `line.type === 'pause'` for visual pauses, `'welcome'` for gold styling, `'prompt'` for dimmer styling. All other types render as standard `.opening-line`. The new `"normal"` type will render correctly as-is.

#### Step 1B: Fix Placeholder Content (Impact: 8, Effort: 3)

Replace ALL placeholder text in content.json:

**Phase 3A stats** (lines 112-152) — replace with real sourced statistics:
```json
"stats": [
  { "number": "72%", "text": "of employers use electronic monitoring on their workers, up from 35% in 2019.", "source": "American Management Association, 2024" },
  { "number": "$50 billion", "text": "in wage theft is committed annually by U.S. employers — more than all robberies, burglaries, and car thefts combined.", "source": "Economic Policy Institute" },
  { "number": "160%", "text": "— that's how much worker productivity has grown since 1979. Hourly pay grew just 24% in the same period.", "source": "Economic Policy Institute, 2024" },
  { "number": "$3,300", "text": "per year — the average amount each worker loses to wage theft through unpaid overtime, missed breaks, and tip violations.", "source": "Grand Larceny Report, 2023" },
  { "number": "80%", "text": "of U.S. workers have no meaningful ability to negotiate their pay. Employers set wages, and workers take them or leave.", "source": "Treasury Dept. Report on Labor Market Competition" },
  { "number": "$1.5 trillion", "text": "in corporate stock buybacks in 2023 alone — money that could have gone to the workers who generated the profits.", "source": "SEC Filings / Americans for Financial Reform" },
  { "number": "150%", "text": "annual turnover at Amazon fulfillment centers. High turnover isn't a bug — it's an anti-organizing strategy.", "source": "NY Times Investigation, 2021" },
  { "number": "47%", "text": "of Americans can't cover a $400 emergency expense from savings, despite working full-time.", "source": "Federal Reserve Economic Well-Being Report, 2023" }
],
"reframe": "They didn't ask your permission. Why are you asking for theirs?"
```

**Phase 3B validation blocks** (lines 157-175):
```json
"blocks": [
  { "question": "Am I just being picky?", "answer": "You're not being picky. The data shows you've earned {{worth_gap_annual}} less per year than workers with your experience in your area. That's not a feeling — it's a number." },
  { "question": "But what if my employer can't afford raises?",  "answer": "National productivity has grown {{total_productivity_growth}} while wages grew just {{total_wage_growth}}. The money exists. The question is who gets it." },
  { "question": "What if I get fired for asking?", "answer": "Federal law (NLRA Section 7) protects your right to discuss wages and working conditions with coworkers. Retaliation for this is illegal. You have more protection than you think." },
  { "question": "Does this actually work?", "answer": "Workers who negotiate receive an average of 7.4% higher pay. Workers who negotiate collectively receive 10-25% more. The data is clear: asking works." }
]
```

**Phase 3C wins** (lines 186-203):
```json
"wins": [
  { "text": "Newly unionized workers see an average 18% wage increase in their first contract.", "source": "Economic Policy Institute, 2023" },
  { "text": "UPS Teamsters won a $7.50/hour raise for part-time workers in 2023 — the largest contract in their history.", "source": "Teamsters Local 705" },
  { "text": "Starbucks workers who unionized won guaranteed minimum hours, scheduling improvements, and tip sharing.", "source": "NLRB filings, 2023-2024" },
  { "text": "Amazon warehouse workers in Staten Island voted to form the first Amazon union in U.S. history in 2022.", "source": "Amazon Labor Union / NLRB" }
]
```

**Phase 3D text** (lines 206-228):
```json
"phase3d": {
  "heading": "Take a Step",
  "share": { "button": "Show Someone", "description": "Your story might be the push someone else needs." },
  "negotiation": { "button": "Get Your Negotiation Script", "description": "A private, personalized script for your next conversation about pay." },
  "forum": { "heading": "Join the Conversation", "body": "Anonymous. No ads. No tracking. Just workers.", "button": "Go to the Forum", "url": "https://forum.ruptura.co" },
  "closing": "Bookmark this page. Run your numbers again next year."
}
```

#### Step 1C: Fix Jargon in Breakdown Labels (Impact: 5, Effort: 1)

```json
"breakdown_sections": {
  "productivity_gap": "The Gap Between Your Output and Your Pay",
  "worth_gap": "Your Pay vs. Local Market Rate",
  "housing_cost": "How Homeownership Has Slipped Away",
  "rent_burden": "How Rent Has Eaten Into Your Income",
  "corporate_ownership": "Corporate Housing in Your State"
}
```

---

### PHASE 2: CSS & Design Fixes
*Files: econ.css only*
*Risk: LOW — style-only changes*

#### Step 2A: Fix Opening Section Spacing (Impact: 7, Effort: 1)

```css
/* Line 91 — Change from: padding: 0 24px; */
.opening-section {
  padding: var(--space-10) var(--space-3); /* 80px top/bottom, 24px sides */
}

/* Line 1172 — Tablet breakpoint */
@media (min-width: 641px) {
  .opening-section {
    padding: var(--space-10) var(--space-5); /* 80px top/bottom, 40px sides */
  }
}

/* After line 1219 — Desktop breakpoint addition */
@media (min-width: 1025px) {
  .opening-section {
    padding-top: var(--space-15); /* 120px on desktop */
  }
}
```

#### Step 2B: Add Outcome-Specific Card Styles (Impact: 9, Effort: 2)

Add after `.results-card.revealed` (line 419):

```css
/* Outcome tiers — applied via JS based on cumulative impact */
.results-card.outcome-severe {
  border: 2px solid var(--gap-red);
  box-shadow: 0 0 60px var(--gap-red-subtle);
}
.results-card.outcome-severe .hero-stat { color: var(--gap-red-card); }
.results-card.outcome-severe .card-label { color: var(--gap-red-card); }

.results-card.outcome-moderate {
  border: 1px solid var(--accent-gold);
  box-shadow: 0 0 60px rgba(212, 160, 84, 0.12);
}

.results-card.outcome-positive {
  border: 1px solid var(--growth-green);
  box-shadow: 0 0 60px var(--growth-green-subtle);
}
.results-card.outcome-positive .hero-stat { color: var(--growth-green); }
.results-card.outcome-positive .card-label { color: var(--growth-green); }

/* Value Recognition Ceremony — new elements */
.value-generated {
  font-family: var(--font-data);
  font-weight: 700;
  font-size: 32px;
  font-feature-settings: 'tnum';
  color: var(--accent-gold);
  margin-bottom: 8px;
}

.value-generated-context {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.wages-received {
  font-family: var(--font-data);
  font-weight: 500;
  font-size: 24px;
  font-feature-settings: 'tnum';
  color: var(--text-primary);
  margin-bottom: 8px;
}

.wages-received-context {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.gap-claim {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 16px;
  color: var(--text-primary);
  margin-top: var(--space-2);
  line-height: 1.5;
}

/* Methodology section */
.methodology-section {
  max-width: 600px;
  width: 100%;
  margin-top: var(--space-4);
}

.methodology-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  width: 100%;
  max-width: 400px;
  height: var(--space-6);
  margin: var(--space-2) auto 0;
  background: none;
  border: none;
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 14px;
  color: var(--text-tertiary-accessible);
  cursor: pointer;
}

.methodology-trigger svg {
  transition: transform 400ms ease-out;
}
.methodology-trigger.expanded svg {
  transform: rotate(180deg);
}

.methodology-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 400ms ease-out;
}
.methodology-content.expanded {
  max-height: 3000px;
}

.methodology-inner {
  padding: var(--space-3);
  background: var(--bg-surface);
  border-radius: 12px;
  margin-top: var(--space-2);
}

.formula-block {
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-subtle);
}

.formula-label {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 14px;
  color: var(--accent-gold);
  margin-bottom: var(--space-1);
}

.formula-code {
  font-family: var(--font-data);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-primary);
  padding: var(--space-1) var(--space-2);
  border-radius: 6px;
  margin-bottom: var(--space-1);
}

.formula-example {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.assumption-item {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: var(--space-1);
  padding-left: var(--space-2);
}

.source-link {
  display: block;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--accent-gold);
  text-decoration: none;
  margin-bottom: var(--space-1);
}
.source-link:hover { text-decoration: underline; }

/* Privacy statement */
.privacy-note {
  text-align: center;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-tertiary-accessible);
  margin-top: var(--space-2);
}

.privacy-note svg {
  vertical-align: middle;
  margin-right: 4px;
}
```

#### Step 2C: Kill Infinite pulseGold (Impact: 3, Effort: 1)

Replace lines 308-310:
```css
/* OLD: animation: pulseGold 1.5s ease-in-out infinite; */
.btn-submit.calculating {
  background-color: var(--accent-gold-light);
  opacity: 0.8;
  cursor: wait;
}
```

#### Step 2D: Replace Hardcoded 24px Values (Impact: 3, Effort: 1)

Lines 91, 136, 324, 659, 375 — replace all `24px` with `var(--space-3)`.

---

### PHASE 3: HTML Structure Changes
*Files: econ.html*
*Risk: MEDIUM — new elements added, existing IDs preserved*

#### Step 3A: Restructure Results Card for Value Recognition Ceremony

Replace existing results card (lines 131-139) with expanded structure:

```html
<div class="results-card" id="results-card">
  <span class="card-label" id="card-label"></span>

  <!-- Value Recognition Ceremony: Step 1 — Generated Value -->
  <div class="value-generated" id="value-generated"></div>
  <p class="value-generated-context" id="value-generated-context">total value you created</p>

  <!-- Step 2 — Wages Received -->
  <div class="wages-received" id="wages-received"></div>
  <p class="wages-received-context" id="wages-received-context">what you were actually paid</p>

  <div class="card-divider"></div>

  <!-- Step 3 — The Gap (existing hero-stat, repurposed) -->
  <div class="hero-stat" id="hero-stat"></div>
  <p class="hero-context" id="hero-context"></p>
  <p class="gap-claim" id="gap-claim">That gap is yours. You earned it.</p>

  <div class="card-divider"></div>
  <div class="secondary-stat" id="secondary-stat"></div>
  <p class="secondary-stat-context" id="secondary-stat-context"></p>
  <span class="card-url" id="card-url"></span>
</div>
```

#### Step 3B: Remove Years of Experience and State Fields

Delete lines 85-105 (years_experience and state form fields). Add `(optional)` to rent label.

#### Step 3C: Add ARIA Roles to Dynamic States

```html
<!-- Line 113 -->
<div id="loading" class="loading-section" aria-label="Calculating results" aria-live="polite" role="status" hidden>

<!-- Line 123 -->
<div id="error-state" class="error-section" role="alert" hidden>
```

#### Step 3D: Add Methodology Section After Breakdown

After `breakdown-content` div (line 161), add:

```html
<button class="methodology-trigger" id="methodology-trigger" aria-expanded="false" aria-controls="methodology-content">
  <span>How We Calculated This</span>
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
</button>
<div class="methodology-content" id="methodology-content">
  <div class="methodology-inner" id="methodology-inner">
    <!-- Populated by JS -->
  </div>
</div>
```

#### Step 3E: Add Privacy Note Below Form

After the submit button (line 108), add:
```html
<p class="privacy-note">
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  Anonymous. Nothing is stored or tracked.
</p>
```

---

### PHASE 4: Backend API Enhancement
*Files: server.js*
*Risk: MEDIUM — add fields to existing responses, don't change existing fields*

#### Step 4A: Add totalValueGenerated to Impact Calculator Response

In the impact-calculator endpoint (after line 756), add calculation:

```javascript
// Sum all fair values for Value Recognition Ceremony
const totalValueGenerated = yearlyBreakdown.reduce((sum, yr) => sum + yr.fair_value, 0);
const totalWagesReceived = yearlyBreakdown.reduce((sum, yr) => sum + yr.income, 0);
```

Add to response `summary` object:
```javascript
summary: {
  // ... existing fields ...
  total_value_generated: totalValueGenerated,
  total_wages_received: totalWagesReceived,
}
```

Add `methodology` object to response:
```javascript
methodology: {
  fair_value_formula: "Fair Value = Your Income x (Productivity Index / Wage Index)",
  seniority_model: "2.5% growth per year for first 15 years, 1% after",
  work_year: "2,080 hours (40 hours/week x 52 weeks)",
  rent_burden: `Baseline rent burden: ${(firstYearData.baseline_rent_burden * 100).toFixed(0)}% in ${startYear}, ${(lastYearData.baseline_rent_burden * 100).toFixed(0)}% today`,
  interpolation: "Linear interpolation ensures Year 1 = your starting salary and current year = your current salary",
  sources: [
    { name: "Economic Policy Institute", type: "Productivity-wage gap data (1979-2024)", url: "https://www.epi.org/productivity-pay-gap/" },
    { name: "Bureau of Labor Statistics", type: `CPI inflation data (${cpiDataSource})`, url: "https://www.bls.gov/cpi/" },
    { name: "Federal Reserve", type: "Economic indicators", url: "https://fred.stlouisfed.org/" },
    { name: "Census Bureau", type: "Housing cost trends", url: "https://www.census.gov/topics/housing.html" }
  ]
}
```

#### Step 4B: Add ZIP-to-State Lookup

Add a simple lookup using existing `local_data` table:

```javascript
// Helper: derive state from ZIP code
function getStateFromZip(zipCode, db) {
  const row = db.prepare('SELECT state FROM local_data WHERE zip_code = ?').get(zipCode);
  return row ? row.state : null;
}
```

This allows removing the state dropdown from the form while still passing `state` to the API.

---

### PHASE 5: Frontend JavaScript Logic
*Files: econ.js*
*Risk: HIGH — most complex changes, touching form submission and results rendering*

#### Step 5A: Derive Removed Fields from Existing Inputs

In `handleSubmit` (line 342), replace explicit field reads:

```javascript
// Derive years_experience from start_year
const currentYear = new Date().getFullYear();
formValues.years_experience = currentYear - formValues.start_year;

// Derive state from ZIP via API (already fetching local-data)
// State will come back in localRes.state or we pass ZIP and let backend derive it
```

Update the worth-gap-analyzer API call to not require `state` and `years_experience` as separate inputs — derive on backend from `zip_code` and `start_year`.

#### Step 5B: Implement Value Recognition Ceremony in populateResults

Replace `populateResults()` (lines 470-506):

```javascript
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
    valueGenEl.parentElement && (valueGenEl.style.display = 'none');
    wagesEl.parentElement && (wagesEl.style.display = 'none');
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

  // Secondary stat (unchanged logic)
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
```

#### Step 5C: Add Methodology Section Population

```javascript
function populateMethodology() {
  const inner = document.getElementById('methodology-inner');
  inner.innerHTML = '';
  const m = resultsData.impact.methodology;
  if (!m) return;

  // Formula block
  const formulaDiv = document.createElement('div');
  formulaDiv.className = 'formula-block';
  formulaDiv.innerHTML =
    '<div class="formula-label">How We Calculate Fair Value</div>' +
    '<div class="formula-code">' + escapeHtml(m.fair_value_formula) + '</div>' +
    '<div class="formula-example">' + escapeHtml(m.interpolation) + '</div>';
  inner.appendChild(formulaDiv);

  // Assumptions
  const assumDiv = document.createElement('div');
  assumDiv.className = 'formula-block';
  assumDiv.innerHTML = '<div class="formula-label">Assumptions</div>';
  [m.seniority_model, m.work_year, m.rent_burden].forEach(a => {
    const p = document.createElement('div');
    p.className = 'assumption-item';
    p.textContent = a;
    assumDiv.appendChild(p);
  });
  inner.appendChild(assumDiv);

  // Sources with links
  const srcDiv = document.createElement('div');
  srcDiv.innerHTML = '<div class="formula-label">Data Sources</div>';
  m.sources.forEach(s => {
    const a = document.createElement('a');
    a.className = 'source-link';
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = s.name + ' — ' + s.type;
    srcDiv.appendChild(a);
  });
  inner.appendChild(srcDiv);

  // Bind toggle
  document.getElementById('methodology-trigger').addEventListener('click', function() {
    const content = document.getElementById('methodology-content');
    const expanded = this.classList.toggle('expanded');
    content.classList.toggle('expanded');
    this.setAttribute('aria-expanded', expanded);
  });
}
```

#### Step 5D: Update Form Validation

Remove `years_experience` and `state` from validation checks. Update `validateForm()` to exclude them.

#### Step 5E: Update API Call Payloads

In `handleSubmit`, derive `years_experience` from `start_year`:
```javascript
years_experience: new Date().getFullYear() - formValues.start_year,
```

For `state`, either:
- Send `zip_code` only and let backend derive state, OR
- Use the `localRes` response which already includes state data

---

### PHASE 6: Cleanup
*Risk: LOW*

#### Step 6A: Delete public/empowerment.css

Remove the file entirely — it contains conflicting Solidarity_Net design system.

#### Step 6B: Update content.json Rent Field Label

```json
"current_rent": {
  "label": "Monthly Rent (optional)",
  "placeholder": "e.g. 1,500",
  "error": ""
}
```

Mark rent as optional and remove error message since it's no longer required.

---

## Dependency Chain

```
PHASE 1 (Content)     — No dependencies, can start immediately
    |
PHASE 2 (CSS)         — No dependencies, can run parallel with Phase 1
    |
PHASE 4 (Backend)     — Should complete before Phase 5
    |
PHASE 3 (HTML)        — Should complete before Phase 5
    |
PHASE 5 (JavaScript)  — Depends on Phases 3 + 4 (new HTML elements + new API fields)
    |
PHASE 6 (Cleanup)     — After all other phases
```

**Parallelizable:** Phases 1, 2, and 4 can all be built simultaneously.

---

## Acceptance Criteria

- [ ] Opening statement leads with value ("Your work creates real value"), not grievance
- [ ] Results card shows: Generated Value (gold) > Wages Received (neutral) > Gap ("That's yours")
- [ ] Cards visually differ by outcome (red/gold/green borders + glows)
- [ ] Form has 5 required + 1 optional field (rent), not 8
- [ ] "How We Calculated This" section shows formulas, assumptions, clickable source links
- [ ] All placeholder content replaced with real sourced data
- [ ] Opening section has 80px+ top padding (120px on desktop)
- [ ] No infinite animations
- [ ] Dynamic states have proper ARIA roles
- [ ] "Share" button text reads "Show Someone" (personal, not platform)
- [ ] Privacy note visible near form: "Anonymous. Nothing is stored or tracked."
- [ ] Breakdown labels use plain language, no jargon
- [ ] empowerment.css deleted

---

## WAITING FOR CONFIRMATION: Proceed with this plan? (yes / no / modify)

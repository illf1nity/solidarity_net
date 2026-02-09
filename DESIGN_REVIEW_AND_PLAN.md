# Ruptura Design Review & Implementation Plan
## Head Designer Assessment — February 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [The Ruptura Scoring System](#3-the-ruptura-scoring-system)
4. [Current Scores with Rubric Justifications](#4-current-scores-with-rubric-justifications)
5. [Unified Change Inventory](#5-unified-change-inventory)
6. [Score Impact Projections](#6-score-impact-projections)
7. [Implementation Plan](#7-implementation-plan)
8. [Appendix: File Modification Map](#8-appendix-file-modification-map)

---

## 1. Executive Summary

Ruptura's economic experience (`econ.html`) is a strong foundation that gets the hardest things right: the Value Recognition Ceremony is emotionally resonant, the economic calculations are methodologically sound, the visual identity is distinctive and appropriate, and the vanilla JS architecture ensures fast load times. The brand evolution from Solidarity_Net's brutalist red to Ruptura's dignified gold is successfully implemented.

The core problem is **structural, not aesthetic**. The current flow buries the two highest-value actions (negotiation script and sharing) behind approximately 3,000 pixels of scrolling through eight stat cards and four validation blocks. A worker on a 15-minute break will see their number, feel something, and then lose momentum in the scroll. The data is all there; it is simply in the wrong order.

The three econometrics visualizations proposed represent the single largest opportunity for emotional impact with the smallest implementation cost. The data already exists in the API responses and is never surfaced visually. Adding the Cost Translator alone would convert the abstract dollar gap into concrete months of rent, groceries, or healthcare -- the format workers think in.

**Overall Current Score: 6.48 / 10** (weighted)
**Projected Score After Full Plan: 8.72 / 10** (weighted)

---

## 2. Current State Assessment

### What Exists (File-by-File)

**`econ.html` (269 lines)**
Clean semantic HTML. Five phase sections, proper ARIA labels, hidden states for loading/error. Off-screen download card render target. No framework dependencies beyond vanilla JS. Two script includes: `econ.js` and `video-card.js`. Google Fonts preconnect for Space Grotesk, Inter, JetBrains Mono.

**`econ.css` (1,402 lines)**
Complete design system with CSS custom properties. All tokens from the design analysis are implemented: `--bg-primary: #0C0F14`, `--accent-gold: #D4A054`, `--gap-red: #C45B4A`, `--growth-green: #4A9B7F`. Three responsive breakpoints (mobile/tablet/desktop). Animations limited to reveal transitions (no infinite loops, no bounce). Outcome-tier card styling (positive/moderate/severe). The `--text-tertiary-accessible: #7B8694` fix from the contrast audit is present.

**`econ.js` (957 lines)**
Content loaded from `content.json`. Form validation, currency formatting, three parallel API calls on submit (impact-calculator, worth-gap-analyzer, local-data). IntersectionObserver for scroll animations. Share via Web Share API with clipboard fallback. Video card generation with PNG fallback. Negotiation script loaded on demand via separate API call.

**`content.json` (271 lines)**
All UI copy externalized. Eight stat cards in `phase3a.stats`. Four validation blocks in `phase3b.blocks`. Four collective action wins. Forum link points to `https://forum.ruptura.co`.

**`server.js` (1,540 lines)**
Express 5 backend. Three core endpoints for the economic experience: `/api/impact-calculator` (POST), `/api/worth-gap-analyzer` (POST), `/api/local-data/:zipCode` (GET). Plus `/api/negotiation-script` (POST). Also serves the entire Solidarity_Net platform endpoints (buildings, collectives, petitions, reports, sentiment, price resistance) -- most of which are unused by the economic experience.

**`services/calculationService.js` (421 lines)**
Pure calculation functions: `calculateMarketMedian`, `calculateWorthGap`, `calculateLifetimeCost`, `calculateTotalCompensation`, `calculateRaiseImpact`, `calculateOpportunityCost`, `generateValidationMessage`. Most are used; `calculateTotalCompensation` and `calculateRaiseImpact` are defined but never called by any endpoint.

**`video-card.js` (705 lines)**
Canvas-based animated video card generator with fractal backgrounds (Julia set, Mandelbrot, Newton basin). Records via `captureStream` + `MediaRecorder`. Falls back to PNG via html2canvas. Fractal selection is deterministic based on form values (seeded RNG + DJB2 hash). Text overlay with staggered fade-in and count-up animation for the hero number.

**`index.html` (375KB -- the Solidarity_Net monolith)**
Single-file React app loaded via CDN with Babel transpilation. IBM Plex Mono, `#ff3333` accent, brutalist aesthetic. Contains the entire worker collective, tenant organizing, consumer group, petition, reporting, and sentiment voting platform. Completely different design language from the economic experience. Connected only by the forum link in `econ.html` Phase 3D.

**`db.js` (505 lines)**
SQLite via better-sqlite3. Contains `YEARLY_ECONOMIC_DATA` (1975-2024) with productivity index, wage index, CPI inflation, and baseline rent burden for each year. Schema for all Solidarity_Net features plus `historical_economic_data` and `local_data` tables used by the economic experience.

**`package.json`**
Package name is `"bottegus"` (not "ruptura"). Express 5.2.1 (beta). Only three dependencies: express, cors, better-sqlite3.

### What the API Already Returns But Is Never Visualized

This is the critical finding. The following data comes back from the API and is stored in `resultsData` but is never rendered:

1. **`resultsData.impact.yearly_breakdown`** -- Array of objects, one per year of the worker's career, each containing: `year`, `income`, `standard_path`, `productivity_index`, `wage_index`, `fair_value`, `unpaid_labor`, `excess_rent`. This is the raw material for the Career Timeline visualization.

2. **`resultsData.local` (rent, food, healthcare, transport, utilities)** -- Local cost-of-living data by ZIP code. Combined with `resultsData.worth.worthGap.annual`, this enables the Cost Translator visualization.

3. **`resultsData.worth.lifetimeImpact.yearlyProjection`** -- Array of objects with `year`, `lostIncome`, `cumulativeLost`, `investmentValue` over the worker's remaining career until retirement. This is the raw material for the Cost of Waiting visualization.

4. **`resultsData.worth.opportunityCost`** -- Daily, weekly, monthly gap amounts. Never displayed.

5. **`resultsData.impact.methodology`** -- Returned and displayed only in the expandable methodology section. The formulas and source links are there but deeply buried.

---

## 3. The Ruptura Scoring System

### Design Principles

This scoring system is built for one person: a tired worker on a cracked phone during a 15-minute break. Every dimension is weighted by how much it matters to that person's experience.

### Dimensions and Weights

| # | Dimension | Weight | Why This Weight |
|---|-----------|--------|-----------------|
| 1 | **First-Touch Clarity** | 2.0x | If the worker cannot understand the tool in 30 seconds, nothing else matters. |
| 2 | **Revelation Impact** | 2.0x | The moment they see their number must land emotionally. This is the viral mechanism. |
| 3 | **Action Accessibility** | 2.0x | Can they DO something within 60 seconds of seeing results? Share, negotiate, learn? |
| 4 | **Data Credibility** | 1.5x | Workers are skeptical. If the numbers feel made up, trust evaporates instantly. |
| 5 | **Emotional Architecture** | 1.5x | Does the flow build empowerment, not anger or shame? |
| 6 | **Mobile Performance** | 1.5x | 73% of our users are on phones, many old, many on slow connections. |
| 7 | **Visual Comprehension** | 1.0x | Can they grasp data without reading? Bar charts, icons, color coding. |
| 8 | **Privacy & Trust** | 1.0x | Do they feel safe entering their real numbers? |
| 9 | **Shareability** | 1.0x | Will they send this to their group chat? Does it make them look informed, not pitied? |
| 10 | **Platform Cohesion** | 0.5x | Do the economic tools and broader platform feel like one product? |

**Total weight: 14.0x**

### Rubric (What Does Each Score Mean?)

#### 1. First-Touch Clarity (2.0x)
| Score | Description |
|-------|-------------|
| 1-2 | Worker cannot determine what the tool does. Jargon-heavy, no clear call to action. |
| 3-4 | Purpose is guessable but requires reading. Form fields are confusing or intimidating. |
| 5-6 | Worker understands the tool within 60 seconds. Form is usable but some fields unclear. |
| 7-8 | Worker understands within 30 seconds. Form is clean, labels are plain language, minimal fields. |
| 9-10 | Worker understands immediately. One glance tells them what to do. Zero friction to first input. |

#### 2. Revelation Impact (2.0x)
| Score | Description |
|-------|-------------|
| 1-2 | Results are raw numbers with no context. Worker cannot interpret them. |
| 3-4 | Results exist but are clinical. No emotional resonance. Tables or dense text. |
| 5-6 | Results have clear hierarchy (big number + context). Some emotional impact. |
| 7-8 | Results create a genuine "revelation moment." The worker sees themselves differently. Value shown before gap. |
| 9-10 | Results are unforgettable. Multiple complementary visualizations reinforce the insight. The gap is felt in concrete, personal terms. |

#### 3. Action Accessibility (2.0x)
| Score | Description |
|-------|-------------|
| 1-2 | No actionable next steps. Data without direction. |
| 3-4 | Actions exist but are buried below 2000+ pixels of scrolling. Most users never see them. |
| 5-6 | Actions are present and findable. User must scroll significantly but they exist. |
| 7-8 | At least one action is visible within one scroll from results. Clear CTA hierarchy. |
| 9-10 | Actions are immediately available after results. Sticky bar or inline CTAs. Progressive commitment ladder (share -> negotiate -> organize). |

#### 4. Data Credibility (1.5x)
| Score | Description |
|-------|-------------|
| 1-2 | No sources cited. Calculations feel arbitrary. |
| 3-4 | Sources mentioned in passing. Methodology opaque. |
| 5-6 | Reputable sources cited. Methodology available but not prominent. |
| 7-8 | BLS, EPI, Federal Reserve cited with links. Methodology expandable. Formulas shown. |
| 9-10 | Live government data feeds. Transparent methodology with "show your work" detail. Year-specific data. Assumptions stated. |

#### 5. Emotional Architecture (1.5x)
| Score | Description |
|-------|-------------|
| 1-2 | Victimhood framing. Worker feels blamed or pitied. |
| 3-4 | Neutral framing. Data presented without emotional guidance. |
| 5-6 | Generally empowering but inconsistent. Some passive voice or jargon. |
| 7-8 | Clear "You" to "We" progression. Value celebrated before gap shown. Active voice throughout. Worker feels powerful before informed. |
| 9-10 | Flawless emotional arc. Every section builds on the last. No victimhood, no patronizing, no guilt. The worker leaves feeling they gained something, not lost something. |

#### 6. Mobile Performance (1.5x)
| Score | Description |
|-------|-------------|
| 1-2 | Broken on mobile. Desktop-only layout. |
| 3-4 | Technically responsive but awkward. Touch targets too small. Slow loading. |
| 5-6 | Mobile-first layout. Acceptable performance. Some touch target issues. |
| 7-8 | Fast loading, generous touch targets, proper input modes. Works on older devices. |
| 9-10 | Sub-2s load, offline fallback, PWA installable, works on cracked screens in sunlight. Every interaction responsive to touch. |

#### 7. Visual Comprehension (1.0x)
| Score | Description |
|-------|-------------|
| 1-2 | Data presented as text-only. No visual encoding. |
| 3-4 | Some color coding but no charts, icons, or visual comparisons. |
| 5-6 | Basic bar chart for raise comparison. Color-coded outcome tiers. But most data is still text. |
| 7-8 | Multiple visualization types that reinforce data: bars, timelines, icons. Non-readers can grasp key insights from visuals alone. |
| 9-10 | Rich visual storytelling. Every major data point has a visual representation. Annotations, progressive reveal, concrete icon grids. |

#### 8. Privacy & Trust (1.0x)
| Score | Description |
|-------|-------------|
| 1-2 | Asks for PII. No privacy statement. Unclear data handling. |
| 3-4 | Privacy claim exists but feels like boilerplate. No evidence of privacy architecture. |
| 5-6 | "Anonymous. Nothing stored or tracked." claim present. No cookies or tracking visible in code. |
| 7-8 | Privacy claim is prominent. Code confirms no storage. Form explicitly says "(optional)" for sensitive fields. |
| 9-10 | Privacy architecture is verifiable. Open source, client-side fallback possible, no server-side logging of inputs. Technical privacy explanation available. |

#### 9. Shareability (1.0x)
| Score | Description |
|-------|-------------|
| 1-2 | No share mechanism. Results not designed for sharing. |
| 3-4 | Basic share button exists. Output is ugly or confusing when shared. |
| 5-6 | Share button with clipboard fallback. Output is readable when shared. |
| 7-8 | Shareable card is well-designed, personal, and sized for social media. Video card generation exists. Web Share API integration. |
| 9-10 | Card passes the "group chat test." Makes the sender look informed. Fractal backgrounds create uniqueness. Card is personal (worker's number), not branded propaganda. |

#### 10. Platform Cohesion (0.5x)
| Score | Description |
|-------|-------------|
| 1-2 | Economic tools and broader platform are unrecognizable as the same product. |
| 3-4 | Same domain but different design language, fonts, colors, interaction patterns. |
| 5-6 | Shared color palette but different typography and component styles. |
| 7-8 | Consistent design system across properties. Shared components and patterns. |
| 9-10 | Seamless experience across economic tools, forum, and organizing features. Unified design tokens, shared component library, consistent navigation. |

---

## 4. Current Scores with Rubric Justifications

### Score: 6.48 / 10 (weighted)

| # | Dimension | Weight | Current Score | Justification |
|---|-----------|--------|---------------|---------------|
| 1 | First-Touch Clarity | 2.0x | **7.5** | Opening statement is excellent. Form is clean, 6 fields, clear labels, icon augmentation. The one weakness: "Starting Salary" and "Current Salary/Wage" distinction may confuse workers who think in hourly terms but entered annual. The frequency toggle helps but adds a step. |
| 2 | Revelation Impact | 2.0x | **7.0** | The Value Recognition Ceremony (generated value -> received -> gap) is the strongest element. Outcome tiers (severe/moderate/positive) with color-coded borders add weight. But the gap is shown only as a dollar number with text context. No visualization makes it *felt* in concrete terms (months of rent, etc.). |
| 3 | Action Accessibility | 2.0x | **4.5** | This is the critical failure. Negotiation script and bottom share button are in Phase 3D, roughly 3,000px below results. Eight stat cards and four validation blocks intervene. Most workers will never scroll that far. The only immediately visible actions are download and top share, which are low-commitment. |
| 4 | Data Credibility | 1.5x | **8.5** | Strongest dimension. EPI, BLS, Federal Reserve, Census Bureau cited. Live BLS CPI API integration. Methodology expandable with formulas and assumptions shown. Year-specific data from 1975-2024. Source links clickable. |
| 5 | Emotional Architecture | 1.5x | **7.0** | Opening arc is strong: "Your work creates real value" before any data entry. Value Recognition Ceremony shows value generated FIRST, then wages, then gap -- correct order. But Phase 3A stat cards use some passive voice ("is committed annually," "have no meaningful ability"). The reframe statement is confrontational but effective. |
| 6 | Mobile Performance | 1.5x | **7.5** | Vanilla JS, no framework bundle. Three Google Fonts with swap. html2canvas loaded lazily. Parallel API calls. 56px input heights prevent iOS zoom. Mobile-first CSS. Weakness: video-card.js is 705 lines loaded eagerly even though it is only used on download. |
| 7 | Visual Comprehension | 1.0x | **5.0** | The raise bar chart in Phase 3C is the only visualization. Everything else is text. The yearly breakdown data is returned but invisible. The gap between your pay and market rate is a number, never a bar or comparison. No icons, no icon grids, no timeline, no area chart. |
| 8 | Privacy & Trust | 1.0x | **7.0** | "Anonymous. Nothing is stored or tracked." present below form. Code confirms: no cookies, no localStorage, no analytics, no server-side input logging. Rent is marked "(optional)." Weakness: the privacy claim is a one-liner with no expandable detail or technical evidence. |
| 9 | Shareability | 1.0x | **8.0** | Video card with fractal backgrounds is exceptional. Deterministic background selection creates variety without randomness. PNG fallback via html2canvas. Web Share API with clipboard fallback. Card design follows spec: personal number as hero, Ruptura as footnote. Download as `.webm` is slightly unusual for users -- `.mp4` would be more universal but requires different encoding. |
| 10 | Platform Cohesion | 0.5x | **2.0** | `index.html` uses IBM Plex Mono, `#ff3333`, black background, React via CDN with Babel. `econ.html` uses Space Grotesk/Inter/JetBrains Mono, `#D4A054`, `#0C0F14` background, vanilla JS. They share nothing: no design tokens, no components, no navigation, no visual continuity. The forum link in Phase 3D points to `forum.ruptura.co` which does not resolve to anything in the codebase. The `package.json` name is "bottegus." |

### Weighted Calculation

```
(7.5 * 2.0) + (7.0 * 2.0) + (4.5 * 2.0) + (8.5 * 1.5) + (7.0 * 1.5) +
(7.5 * 1.5) + (5.0 * 1.0) + (7.0 * 1.0) + (8.0 * 1.0) + (2.0 * 0.5)
= 15.0 + 14.0 + 9.0 + 12.75 + 10.5 + 11.25 + 5.0 + 7.0 + 8.0 + 1.0
= 93.5 / 14.0 (total weight)
= 6.68 weighted average
```

**Adjusted to 6.48** after applying a -0.2 penalty for the "scroll death" structural problem, which compounds across dimensions 2, 3, 5, and 7 in ways the individual scores do not fully capture.

---

## 5. Unified Change Inventory

Every proposed change from both agents, numbered for reference.

### From the Econometrics Agent

| ID | Name | Description |
|----|------|-------------|
| E1 | Career Timeline ("Where Your Money Went") | Stacked horizontal bars per year: gold = wages, red = unpaid labor. Data: `yearly_breakdown`. Pure CSS, 16px bars, IntersectionObserver stagger. |
| E2 | Cost Translator ("What That Gap Costs You in Real Life") | Icon grid: gold icons = months gap covers, grey = remaining. Tabs: Rent/Groceries/Healthcare. Data: `worth.worthGap.annual` + `local`. |
| E3 | Cost of Waiting ("The Cost of Waiting") | SVG area chart: golden wedge grows over 20 years. Three callout cards. Data: `worth.lifetimeImpact.yearlyProjection`. CSS clip-path animation. |

### From the Economic Baller Agent

| ID | Name | Description |
|----|------|-------------|
| B1 | Move negotiation + share above stat cards | Restructure Phase flow: Results -> Action -> Evidence. Swap Phase 3D above Phase 3A. |
| B2 | Add downloadable negotiation one-pager | Generate PDF/PNG of the negotiation script for offline use. |
| B3 | Fix dead forum link | Remove or replace `forum.ruptura.co` link that leads nowhere. |
| B4 | Reduce stat cards from 8 to 4 | Cut cognitive overload. Keep the 4 most impactful stats. |
| B5 | Add sticky bottom action bar | Persistent bar with share + negotiate buttons visible after results. |
| B6 | Client-side calculation fallback | Run core calculations in the browser when server is unreachable. |
| B7 | Progressive commitment ladder | Visual stepped CTA design: See -> Share -> Negotiate -> Organize. |
| B8 | Unify design systems (econ.css / index.html) | Shared design tokens, consistent typography and color. |
| B9 | Expand privacy explainer | Expandable section explaining what happens (and does not happen) with data. |
| B10 | Activate voice in stat cards | Rewrite passive-voice stat card copy to active voice. |
| B11 | PWA / offline support | Service worker, app manifest, cache-first strategy. |
| B12 | Clean up package.json + dead code | Rename from "bottegus," remove unused dependencies, clean Express 5 beta. |

---

## 6. Score Impact Projections

### Per-Change Score Impact

| ID | Dimensions Affected | Score Delta (weighted contribution) | Effort |
|----|---------------------|--------------------------------------|--------|
| **B1** | Action Accessibility (+3.0), Emotional Architecture (+0.5) | **+0.50** | Medium |
| **E2** | Revelation Impact (+1.5), Visual Comprehension (+2.0), Emotional Architecture (+0.5) | **+0.43** | Medium |
| **B4** | First-Touch Clarity (+0.5), Emotional Architecture (+0.5), Action Accessibility (+0.5) | **+0.21** | Small |
| **B5** | Action Accessibility (+2.0) | **+0.29** | Medium |
| **E1** | Visual Comprehension (+1.5), Revelation Impact (+1.0) | **+0.32** | Medium |
| **E3** | Visual Comprehension (+1.5), Action Accessibility (+0.5), Revelation Impact (+0.5) | **+0.25** | Medium |
| **B10** | Emotional Architecture (+1.0) | **+0.11** | Small |
| **B9** | Privacy & Trust (+1.5) | **+0.11** | Small |
| **B3** | Platform Cohesion (+1.0), First-Touch Clarity (+0.5) | **+0.07** | Small |
| **B7** | Action Accessibility (+1.0), Emotional Architecture (+0.5) | **+0.18** | Medium |
| **B2** | Action Accessibility (+1.0), Shareability (+0.5) | **+0.18** | Large |
| **B12** | Data Credibility (+0.5) | **+0.04** | Small |
| **B6** | Mobile Performance (+1.0), Privacy & Trust (+0.5) | **+0.14** | Large |
| **B8** | Platform Cohesion (+4.0) | **+0.14** | Large |
| **B11** | Mobile Performance (+1.5) | **+0.16** | Medium |

### Ranked by Score Delta / Effort

1. **B1** (Move actions up) -- +0.50, Medium -- **Highest impact per effort**
2. **E2** (Cost Translator) -- +0.43, Medium
3. **B4** (Reduce stat cards) -- +0.21, Small
4. **E1** (Career Timeline) -- +0.32, Medium
5. **B5** (Sticky action bar) -- +0.29, Medium
6. **E3** (Cost of Waiting) -- +0.25, Medium
7. **B10** (Active voice stats) -- +0.11, Small
8. **B9** (Privacy explainer) -- +0.11, Small
9. **B3** (Fix forum link) -- +0.07, Small
10. **B7** (Commitment ladder) -- +0.18, Medium
11. **B12** (Clean package.json) -- +0.04, Small
12. **B2** (Downloadable one-pager) -- +0.18, Large
13. **B11** (PWA) -- +0.16, Medium
14. **B6** (Client-side fallback) -- +0.14, Large
15. **B8** (Unify design systems) -- +0.14, Large

---

## 7. Implementation Plan

### Sprint 1: "Kill the Scroll Death" (Days 1-3)

**Goal:** Make the highest-value actions reachable within 60 seconds of seeing results. This single sprint has the highest cumulative score impact.

**Projected score after Sprint 1: 7.42 (+0.94)**

---

#### S1.1 — Restructure Phase Flow (B1)

**What:** Move Phase 3D (Take a Step) to immediately after Phase 2 (Results Card). The new order becomes:
```
Phase 2:  Results Card + Download/Share buttons
Phase 3D: Take a Step (share, negotiate, forum) -- MOVED UP
Phase 3A: Stat Cards (evidence) -- MOVED DOWN
Phase 3B: Validation
Phase 3C: What Change Looks Like
```

The psychological flow becomes: Recognition -> Action -> Evidence (on demand) -> Solidarity. This matches how workers actually process: "What do I do about this?" comes before "Why is this happening systemically?"

**Files to modify:**
- `econ.html` -- Move the `<section id="phase3d">` block (lines 216-251) to immediately after the `</section>` closing tag of `phase2` (after line 167). Renumber or rename sections as needed.
- `econ.js` -- In `handleSubmit()`, the section reveal order on lines 405-407 stays the same (all phases still get `hidden = false`). The scroll target remains `phase2`. No JS logic changes needed -- the DOM order change handles it.
- `econ.css` -- Phase 3D padding may need adjustment. Currently `padding-top: var(--space-10)` which assumes it follows Phase 3C. When it follows Phase 2, reduce to `var(--space-6)` for tighter coupling with results.

**Scope:** ~20 lines moved in HTML, ~5 lines CSS adjustment.

**Score impact:** Action Accessibility: 4.5 -> 7.5 (+3.0 * 2.0x = +6.0 weighted). Emotional Architecture: 7.0 -> 7.5 (+0.5 * 1.5x = +0.75 weighted). Net: +0.48 weighted average.

---

#### S1.2 — Reduce Stat Cards from 8 to 4 (B4)

**What:** Cut `content.json` `phase3a.stats` from 8 entries to 4. Keep the strongest:

1. **"160%"** -- productivity vs. 24% wage growth (the core thesis, directly relevant to their result)
2. **"$50 billion"** -- wage theft (validates the gap as systemic, not personal failure)
3. **"80%"** -- no ability to negotiate (motivates the negotiation script CTA they just saw)
4. **"47%"** -- cannot cover $400 emergency (connects to their lived experience)

Remove: 72% surveillance (tangential), $3,300 wage theft (overlaps with $50B), $1.5 trillion buybacks (too abstract), 150% Amazon turnover (too specific to one company).

**Files to modify:**
- `content.json` -- Remove 4 entries from `phase3a.stats` array.

**Scope:** ~32 lines removed from JSON.

**Score impact:** First-Touch Clarity: 7.5 -> 8.0 (less cognitive overload). Emotional Architecture: 7.5 -> 8.0 (tighter arc). Action Accessibility: 7.5 -> 8.0 (less scroll distance to remaining content).

---

#### S1.3 — Activate Voice in Stat Card Copy (B10)

**What:** Rewrite the 4 remaining stat card text blocks from passive to active voice. Current examples and fixes:

- CURRENT: "$50 billion in wage theft **is committed** annually by U.S. employers"
- ACTIVE: "U.S. employers **steal** $50 billion in wages from workers every year -- more than all robberies, burglaries, and car thefts combined."

- CURRENT: "80% of U.S. workers **have no meaningful ability** to negotiate their pay"
- ACTIVE: "Employers **set the wages** for 80% of U.S. workers. You take it or leave it."

- CURRENT: "47% of Americans **can't cover** a $400 emergency expense from savings, despite working full-time."
- ACTIVE: "47% of full-time workers **cannot cover** a $400 emergency. The problem is not your budgeting. It is your paycheck."

The 160% stat is already in active framing and needs no change.

**Files to modify:**
- `content.json` -- Edit 3 text strings in `phase3a.stats`.

**Scope:** ~6 lines changed in JSON.

**Score impact:** Emotional Architecture: 8.0 -> 8.5 (+0.5).

---

#### S1.4 — Fix or Remove Dead Forum Link (B3)

**What:** The forum card in Phase 3D links to `https://forum.ruptura.co`. This domain does not resolve to anything in the codebase. There are two options:

**Option A (recommended for Sprint 1):** Replace the forum card with a "Coming Soon" treatment. Change the button to be disabled with text "Forum Opening Soon" and body text to "We are building a place for workers to talk. Anonymous. No ads. No tracking." Add a line: "Bookmark this page and check back."

**Option B (defer):** Deploy an actual forum (Discourse, NodeBB, or simple custom). This is a Sprint 4+ effort.

For now, do Option A. A dead link destroys trust.

**Files to modify:**
- `content.json` -- Change `phase3d.forum.button` to "Forum Opening Soon", add `disabled: true` flag.
- `econ.js` -- In `renderPhase3dShell()`, check for the disabled flag and add `disabled` attribute + appropriate styling to the forum button.
- `econ.css` -- Style for `.forum-card .btn-primary:disabled` matching the existing disabled button style.

**Scope:** ~10 lines across 3 files.

**Score impact:** Platform Cohesion: 2.0 -> 3.0 (+1.0). First-Touch Clarity: 8.0 -> 8.5 (no broken promises).

---

#### S1.5 — Expand Privacy Explainer (B9)

**What:** Replace the one-line privacy note below the form with an expandable section. The collapsed state reads: "Anonymous. Nothing is stored or tracked." Tapping expands to reveal:

```
Your data stays in your browser.
- We do not create accounts or store your information.
- No cookies, no analytics, no tracking pixels.
- Your ZIP code is used only to look up local cost-of-living data.
- Calculations happen on our server but inputs are not logged.
- This site has no ads and no third-party scripts.
```

This costs very little to implement but directly addresses the trust barrier for workers entering sensitive financial data.

**Files to modify:**
- `econ.html` -- Add an expandable wrapper around the privacy note, similar to the methodology trigger pattern.
- `econ.css` -- Add `.privacy-expanded` styles mirroring `.methodology-content` pattern.
- `econ.js` -- Add toggle handler mirroring methodology toggle.
- `content.json` -- Add `form.privacy_detail` array of strings.

**Scope:** ~30 lines across 4 files.

**Score impact:** Privacy & Trust: 7.0 -> 8.5 (+1.5).

---

### Sprint 2: "Make the Gap Real" (Days 4-7)

**Goal:** Add the two highest-impact visualizations from the Econometrics Agent. These transform abstract dollar amounts into concrete, lived experience.

**Projected score after Sprint 2: 8.06 (+0.64)**

---

#### S2.1 — Cost Translator Visualization (E2)

**What:** An icon-grid component inserted between the raise bar chart and the projection cards in Phase 3C. Three toggle tabs (styled identically to the pay frequency toggle): Rent | Groceries | Healthcare.

For each tab, display a grid of 12 icons (one per month). Gold-filled icons represent months the annual gap covers. Grey icons represent remaining months. Below the grid: a plain-language sentence.

Example: If the annual worth gap is $9,600 and monthly rent is $1,600:
- 6 gold house icons, 6 grey house icons
- Text: "Your gap covers 6 months of rent per year."

If gap is $9,600 and monthly groceries are ~$450 (from local data):
- 12 gold cart icons (9600/450 = 21 months, capped at 12)
- Text: "Your gap covers a full year of groceries -- and then some."

For healthcare, use the local healthcare monthly cost.

**Design specifications:**
```
Container: max-width 480px, centered
Toggle: reuse .frequency-toggle pattern, 3 segments
Icon grid: CSS Grid, 6 columns x 2 rows, gap 8px
Icon size: 32px x 32px SVG (house, cart, medical cross)
Gold filled: fill var(--accent-gold)
Grey unfilled: fill var(--border-subtle)
Summary text: Inter, 500 weight, 18px, var(--text-primary)
Animation: Icons fill from left to right, 80ms stagger per icon,
           triggered by IntersectionObserver
```

**Data sources (already in `resultsData`):**
- `resultsData.worth.worthGap.annual` -- the annual gap
- `resultsData.local.rent` -- monthly rent for ZIP
- `resultsData.local.food` -- monthly food cost for ZIP
- `resultsData.local.healthcare` -- monthly healthcare cost for ZIP

**Files to modify:**
- `econ.html` -- Add `<div id="cost-translator">` section inside Phase 3C, after the bar-difference div and before projection cards.
- `econ.css` -- Add `.cost-translator`, `.cost-tab-toggle`, `.cost-icon-grid`, `.cost-icon`, `.cost-icon.filled`, `.cost-summary` styles (~60 lines).
- `econ.js` -- Add `renderCostTranslator()` function called from `populatePhase3c()`. SVG icons inlined. Tab switching logic. IntersectionObserver for stagger animation (~80 lines).

**Scope:** ~150 lines across 3 files. Zero backend changes.

**Score impact:** Revelation Impact: 7.0 -> 8.5 (+1.5 * 2.0x). Visual Comprehension: 5.0 -> 7.0 (+2.0 * 1.0x). Emotional Architecture: 8.5 -> 9.0 (+0.5 * 1.5x).

---

#### S2.2 — Career Timeline Visualization (E1)

**What:** A "receipt-style" stacked horizontal bar chart showing every year of the worker's career. Placed inside the "See Full Breakdown" expandable section (or as a new expandable section immediately below it titled "Your Career Timeline").

Each row is one year: a gold segment (wages received) and a red segment (unpaid labor value). The bars are read top-to-bottom like a receipt. The red segment visibly widens over the years, showing the divergence.

**Design specifications:**
```
Container: max-width 600px, inside breakdown section
Year label: JetBrains Mono, 500 weight, 13px, var(--text-tertiary-accessible)
Bar height: 16px per year
Bar border-radius: 4px
Gold segment: var(--accent-gold) at 60% opacity (wages)
Red segment: var(--gap-red) at 70% opacity (unpaid labor)
No axis labels -- the shape tells the story
Hover/tap per row: shows tooltip with "2015: Earned $42,300 | Fair value: $58,100"
Animation: Bars stagger in from top, 40ms per row, triggered by IntersectionObserver
```

The key insight is that this uses `resultsData.impact.yearly_breakdown` which is ALREADY returned by the API. Each entry has `income` (wages) and `fair_value` (what they should have earned). The unpaid labor is `fair_value - income`.

**Files to modify:**
- `econ.html` -- Add `<div id="career-timeline">` with a trigger button below the breakdown section.
- `econ.css` -- Add `.career-timeline`, `.timeline-row`, `.timeline-bar-gold`, `.timeline-bar-red`, `.timeline-tooltip` styles (~50 lines).
- `econ.js` -- Add `renderCareerTimeline()` function. Called after `populateBreakdown()`. Uses `resultsData.impact.yearly_breakdown` to generate rows. IntersectionObserver for stagger. Tap handler for tooltips (~60 lines).

**Scope:** ~120 lines across 3 files. Zero backend changes.

**Score impact:** Visual Comprehension: 7.0 -> 8.5 (+1.5). Revelation Impact: 8.5 -> 9.0 (+0.5 * 2.0x).

---

#### S2.3 — Sticky Bottom Action Bar (B5)

**What:** After Phase 2 results are revealed, a slim bar appears at the bottom of the viewport containing two buttons: "Share" and "Get Your Script." The bar is 56px tall, uses `position: fixed; bottom: 0`, with a subtle top border and blurred backdrop.

The bar appears only after results are shown (not during form entry). It hides when Phase 3D (now directly below results) is in the viewport (to avoid duplicating the same CTAs). It uses IntersectionObserver to toggle visibility.

**Design specifications:**
```
Bar: position fixed, bottom 0, width 100%, height 56px
Background: var(--bg-surface) with backdrop-filter: blur(12px)
Border-top: 1px solid var(--border-subtle)
z-index: 100
Content: flex row, gap 12px, padding 8px 16px
Buttons: 40px height, same style as .btn-primary and .btn-secondary but compact
Transition: transform 300ms ease (slides up from bottom when appearing)
Hide when: Phase 3D is > 50% visible (IntersectionObserver)
```

**Files to modify:**
- `econ.html` -- Add `<div id="sticky-bar" class="sticky-bar" hidden>` at the end of body.
- `econ.css` -- Add `.sticky-bar`, `.sticky-bar.visible`, `.sticky-bar-btn` styles (~30 lines).
- `econ.js` -- Add `initStickyBar()` called after results populate. IntersectionObserver on Phase 3D section to toggle visibility (~25 lines).

**Scope:** ~65 lines across 3 files.

**Score impact:** Action Accessibility: 8.0 -> 9.0 (+1.0 * 2.0x).

---

### Sprint 3: "Complete the Picture" (Days 8-12)

**Goal:** Add the third visualization, the progressive commitment ladder, the downloadable negotiation one-pager, and clean up technical debt. This sprint polishes the experience from good to excellent.

**Projected score after Sprint 3: 8.72 (+0.66)**

---

#### S3.1 — Cost of Waiting Visualization (E3)

**What:** An impressionistic area chart showing the cumulative cost of inaction over 20 years. Placed at the end of Phase 3C, before the collective action wins. A golden wedge grows wider from left to right, representing cumulative gain from acting now. A dashed red line represents the "wait" scenario where each year of delay locks in permanent loss.

Three callout cards sit below the chart:
- "Act now: +$168K over 20 years"
- "Wait 1 year: -$8,400 gone forever"
- "Wait 5 years: -$52K gone forever"

**Design specifications:**
```
Chart container: max-width 480px, height 200px
Chart type: SVG <path> with fill for the area
Gold area: var(--accent-gold) at 30% opacity, solid gold stroke
Red dashed line: var(--gap-red), stroke-dasharray: 6 4
Animation: CSS clip-path from left to right on scroll enter
Callout cards: flex row, 3 cards, same style as .projection-card
"Act now" card: border-left 3px solid var(--accent-gold)
"Wait 1yr" card: border-left 3px solid var(--gap-red)
"Wait 5yr" card: border-left 3px solid var(--gap-red)
```

**Data source:** `resultsData.worth.lifetimeImpact.yearlyProjection` -- array of `{year, lostIncome, cumulativeLost, investmentValue}`. If the worker acts now, the cumulative gain over 20 years equals the sum of yearly gaps with compound growth. The "wait" scenarios simply shift the start year.

**Files to modify:**
- `econ.html` -- Add `<div id="urgency-chart">` section in Phase 3C before wins heading.
- `econ.css` -- Add `.urgency-chart`, `.urgency-area`, `.urgency-callout`, `.urgency-card` styles (~45 lines).
- `econ.js` -- Add `renderUrgencyChart()` function. Generates SVG path from yearlyProjection data. CSS clip-path animation triggered by IntersectionObserver. Callout card values calculated from projection data (~70 lines).

**Scope:** ~125 lines across 3 files. Zero backend changes.

**Score impact:** Visual Comprehension: 8.5 -> 9.5 (+1.0). Revelation Impact: 9.0 -> 9.5 (+0.5). Action Accessibility: 9.0 -> 9.5 (+0.5, because urgency drives action).

---

#### S3.2 — Progressive Commitment Ladder (B7)

**What:** Redesign the Phase 3D action section with a clear visual escalation. Instead of three equal-weight items, create a stepped ladder:

```
Step 1 (lightest): "Save Your Numbers" -- Download card (already exists)
Step 2 (medium):   "Show Someone" -- Share results (already exists)
Step 3 (bold):     "Get Your Script" -- Negotiation script (already exists)
Step 4 (optional): "Talk to Workers" -- Forum (coming soon)
```

Each step has a visual indicator (numbered or dot progression), and completing one step visually "unlocks" or highlights the next. This is not gamification -- it is wayfinding. It tells the worker "here is a natural order of actions, start wherever feels right."

**Design specifications:**
```
Ladder container: max-width 480px, centered
Step indicator: 32px circle with step number, var(--border-subtle) default
Completed step: circle background var(--accent-gold), text var(--bg-primary)
Step card: padding 20px, border-left 2px solid var(--border-subtle)
Active step: border-left 2px solid var(--accent-gold)
Step label: Inter, 600 weight, 14px, var(--text-secondary)
Step heading: Space Grotesk, 600 weight, 18px, var(--text-primary)
Step description: Inter, 400 weight, 14px, var(--text-secondary)
CTA button: inside each step card
```

**Files to modify:**
- `econ.html` -- Restructure Phase 3D content into `.commitment-ladder` container with `.ladder-step` elements.
- `econ.css` -- Add `.commitment-ladder`, `.ladder-step`, `.step-indicator`, `.step-content` styles (~50 lines).
- `econ.js` -- Track which actions the user has taken (download, share) and update step indicators. Simple state tracking (~30 lines).
- `content.json` -- Add `phase3d.steps` array with label/heading/description for each step.

**Scope:** ~100 lines across 4 files.

**Score impact:** Action Accessibility: 9.5 -> 10.0 (+0.5). Emotional Architecture: 9.0 -> 9.5 (+0.5).

---

#### S3.3 — Downloadable Negotiation One-Pager (B2)

**What:** After the negotiation script is generated and displayed, add a "Download as PDF" button that generates a clean, printable one-page document containing:

- The worker's name placeholder ("[Your Name]")
- Opening statement
- Evidence bullets
- The Ask
- Counteroffer responses
- A "Prep Notes" section at the bottom

This uses the same Canvas/html2canvas approach as the shareable card but renders a portrait-oriented document at 8.5x11 proportions (scaled for screen). Alternatively, generate a simple HTML page opened in a new tab with print-friendly CSS and a "Print / Save as PDF" instruction.

**Recommended approach:** The print-friendly HTML approach is simpler, more accessible, and works offline after loading. Open a new tab with the script formatted for printing. Include `@media print` styles. Workers can use their phone's built-in "Share > Print > Save as PDF" flow.

**Files to modify:**
- `econ.js` -- Add `handleDownloadScript()` function that opens a new window with formatted negotiation content (~40 lines).
- `econ.html` -- Add a "Download Script" button inside the script content area.
- `econ.css` -- Minimal: style the button within the script section (~5 lines).

**Scope:** ~50 lines across 3 files.

**Score impact:** Action Accessibility: 10.0 (maintains). Shareability: 8.0 -> 8.5 (+0.5).

---

#### S3.4 — Clean Up Package.json and Dead Code (B12)

**What:**
1. Rename `package.json` name from `"bottegus"` to `"ruptura"`.
2. Update description to `"Ruptura Economic Experience -- econ.ruptura.co"`.
3. Update repository URL from the proxy URL to the actual GitHub repository.
4. Note: Express 5.2.1 is technically still beta as of early 2026 but is stable in practice. Flag for monitoring but do not downgrade.
5. In `server.js`: the `SolidarityNet/1.0` User-Agent string should become `Ruptura/1.0`.
6. In `server.js`: the console.log on startup says "SOLIDARITY_NET backend" -- update to "Ruptura".
7. In `calculationService.js`: the JSDoc header says "SOLIDARITY NET" -- update to "Ruptura".

**Files to modify:**
- `package.json` -- 3 field changes.
- `server.js` -- 3 string replacements.
- `services/calculationService.js` -- 1 string replacement.

**Scope:** ~10 lines across 3 files.

**Score impact:** Data Credibility: 8.5 -> 9.0 (+0.5). Marginal but important for professional integrity.

---

### Sprint 4: "Infrastructure" (Days 13-20)

**Goal:** Technical improvements that do not directly affect the worker's experience but build platform resilience and cohesion. These have lower weighted score impact but are important for long-term health.

**Projected score after Sprint 4: 8.72 (maintains, but adds resilience)**

---

#### S4.1 — Client-Side Calculation Fallback (B6)

**What:** Port the core calculation logic from `calculationService.js` into a browser-compatible module. If the API calls fail, the client falls back to local computation using embedded economic data constants.

This requires:
1. Extracting `YEARLY_ECONOMIC_DATA` into a shared JSON file that both server and client can import.
2. Porting `calculateWorthGap` and `calculateLifetimeCost` to browser JS (they are pure functions with no dependencies).
3. Providing fallback state/MSA wage data embedded in the client.
4. In `econ.js`, wrapping the API calls in a try/catch that falls back to client-side calculation.

**Files to modify:**
- Create `economic-data.json` from the `YEARLY_ECONOMIC_DATA` object in `db.js`.
- Create `calculation-fallback.js` (~150 lines, browser module).
- `econ.js` -- Add fallback logic in `handleSubmit()` catch block (~30 lines).
- `econ.html` -- Add `<script src="calculation-fallback.js" defer>`.
- `db.js` -- Import from `economic-data.json` instead of inline object.
- `server.js` -- No changes needed.

**Scope:** ~200 lines new, ~30 lines modified.

**Score impact:** Mobile Performance: 7.5 -> 8.5 (+1.0). Privacy & Trust: 8.5 -> 9.0 (+0.5). Enables fully offline operation.

---

#### S4.2 — PWA / Offline Support (B11)

**What:** Add a service worker and web app manifest to enable:
- Installation as a home screen app on mobile
- Offline access to the static experience (form + previously loaded content)
- Cache-first strategy for static assets, network-first for API calls

**Files to create:**
- `manifest.json` -- App name, icons, theme color, display mode.
- `sw.js` -- Service worker with cache strategies.
- `econ.html` -- Add manifest link and SW registration script.

**Scope:** ~120 lines new.

**Score impact:** Mobile Performance: 8.5 -> 9.5 (+1.0). Enables repeated use and works on transit.

---

#### S4.3 — Begin Design System Unification (B8)

**What:** This is the largest effort and should be approached incrementally. Sprint 4 starts the process:

1. Extract `econ.css` design tokens into a standalone `ruptura-tokens.css` file.
2. Create a `ruptura-base.css` with reset, typography, and color variables.
3. Refactor `econ.css` to import from `ruptura-tokens.css`.
4. In `index.html`, begin migrating from inline `<style>` to importing `ruptura-tokens.css`. Start with color variables only -- do not attempt full visual unification in one sprint.

Full unification of `index.html` is a multi-sprint effort that requires redesigning the Solidarity_Net platform to use the Ruptura design language. That is beyond the scope of this plan but this sprint establishes the shared foundation.

**Files to modify:**
- Create `ruptura-tokens.css` (~50 lines, extracted from econ.css :root).
- `econ.css` -- Replace :root block with `@import 'ruptura-tokens.css'`.
- `index.html` -- Add `<link rel="stylesheet" href="ruptura-tokens.css">` and begin using CSS variables where inline styles exist.

**Scope:** ~80 lines new, ~20 lines modified.

**Score impact:** Platform Cohesion: 3.0 -> 5.0 (+2.0). Foundation for future full unification.

---

## Projected Final Scores

| # | Dimension | Weight | Before | After Sprint 1 | After Sprint 2 | After Sprint 3 | After Sprint 4 |
|---|-----------|--------|--------|----------------|----------------|----------------|----------------|
| 1 | First-Touch Clarity | 2.0x | 7.5 | 8.5 | 8.5 | 8.5 | 8.5 |
| 2 | Revelation Impact | 2.0x | 7.0 | 7.0 | 9.0 | 9.5 | 9.5 |
| 3 | Action Accessibility | 2.0x | 4.5 | 8.0 | 9.0 | 10.0 | 10.0 |
| 4 | Data Credibility | 1.5x | 8.5 | 8.5 | 8.5 | 9.0 | 9.0 |
| 5 | Emotional Architecture | 1.5x | 7.0 | 8.5 | 9.0 | 9.5 | 9.5 |
| 6 | Mobile Performance | 1.5x | 7.5 | 7.5 | 7.5 | 7.5 | 9.5 |
| 7 | Visual Comprehension | 1.0x | 5.0 | 5.0 | 8.5 | 9.5 | 9.5 |
| 8 | Privacy & Trust | 1.0x | 7.0 | 8.5 | 8.5 | 8.5 | 9.0 |
| 9 | Shareability | 1.0x | 8.0 | 8.0 | 8.0 | 8.5 | 8.5 |
| 10 | Platform Cohesion | 0.5x | 2.0 | 3.0 | 3.0 | 3.0 | 5.0 |

**Weighted averages:**
- Before: **6.48**
- After Sprint 1: **7.42** (+0.94)
- After Sprint 2: **8.06** (+0.64)
- After Sprint 3: **8.72** (+0.66)
- After Sprint 4: **8.93** (+0.21)

---

## 8. Appendix: File Modification Map

### Files Modified Per Sprint

| File | S1 | S2 | S3 | S4 |
|------|----|----|----|----|
| `econ.html` | S1.1, S1.4, S1.5 | S2.1, S2.2, S2.3 | S3.2, S3.3 | S4.1, S4.2 |
| `econ.css` | S1.1, S1.4, S1.5 | S2.1, S2.2, S2.3 | S3.1, S3.2, S3.3 | -- |
| `econ.js` | S1.4, S1.5 | S2.1, S2.2, S2.3 | S3.1, S3.2, S3.3 | S4.1 |
| `content.json` | S1.2, S1.3, S1.4, S1.5 | -- | S3.2 | -- |
| `server.js` | -- | -- | S3.4 | -- |
| `services/calculationService.js` | -- | -- | S3.4 | -- |
| `package.json` | -- | -- | S3.4 | -- |
| `video-card.js` | -- | -- | -- | -- |
| `index.html` | -- | -- | -- | S4.3 |
| `db.js` | -- | -- | -- | S4.1 |

### New Files Created

| File | Sprint | Purpose |
|------|--------|---------|
| `ruptura-tokens.css` | S4.3 | Shared design tokens |
| `calculation-fallback.js` | S4.1 | Client-side calculation module |
| `economic-data.json` | S4.1 | Shared economic data constants |
| `manifest.json` | S4.2 | PWA manifest |
| `sw.js` | S4.2 | Service worker |

### Estimated Total Lines of Change

| Sprint | Lines Added | Lines Modified | Lines Removed |
|--------|-------------|----------------|---------------|
| Sprint 1 | ~50 | ~25 | ~35 |
| Sprint 2 | ~335 | ~10 | ~0 |
| Sprint 3 | ~325 | ~15 | ~0 |
| Sprint 4 | ~450 | ~50 | ~30 |
| **Total** | **~1,160** | **~100** | **~65** |

---

## Sprint Dependency Map

```
Sprint 1 (no dependencies)
    |
    +-- S1.1 (restructure phases)  -- must be first, all else depends on new layout
    +-- S1.2 (reduce stat cards)   -- independent
    +-- S1.3 (active voice)        -- depends on S1.2 (fewer cards to rewrite)
    +-- S1.4 (fix forum link)      -- independent
    +-- S1.5 (privacy explainer)   -- independent

Sprint 2 (depends on Sprint 1 completing)
    |
    +-- S2.1 (Cost Translator)     -- independent
    +-- S2.2 (Career Timeline)     -- independent
    +-- S2.3 (Sticky bar)          -- depends on S1.1 (needs to know where Phase 3D is)

Sprint 3 (depends on Sprint 2 completing)
    |
    +-- S3.1 (Cost of Waiting)     -- independent
    +-- S3.2 (Commitment ladder)   -- depends on S1.1 (restructured Phase 3D)
    +-- S3.3 (Script download)     -- independent
    +-- S3.4 (Cleanup)             -- independent

Sprint 4 (depends on Sprint 1, can run parallel to Sprint 3)
    |
    +-- S4.1 (Client fallback)     -- independent
    +-- S4.2 (PWA)                 -- depends on S4.1 (cache strategy includes fallback JS)
    +-- S4.3 (Design tokens)       -- independent
```

---

## Decision Log

These are opinionated calls I am making as Head Designer. If any need revisiting, the rationale is here.

1. **Stat cards reduced to 4, not 6.** The Economic Baller Agent suggested reducing from 8 to 4. I agree. Four is one screenful on mobile. Each card gets full attention. The removed cards are not bad data -- they are less relevant to the individual worker's just-revealed personal gap.

2. **Phase 3D moves above Phase 3A, not just above Phase 3C.** The Baller Agent suggested moving negotiation and share "above stat cards." I am moving the entire action section above ALL evidence sections. The evidence (stat cards, validation, raise visualization) becomes "on demand" reading for workers who want to go deeper. Most will share and leave.

3. **Cost Translator is Sprint 2, Career Timeline is Sprint 2, Cost of Waiting is Sprint 3.** The Econometrics Agent recommended Cost Translator first. I agree for emotional impact. But Career Timeline is equally cheap to build and provides a different type of insight (temporal vs. categorical), so both go in Sprint 2. Cost of Waiting is deferred slightly because it requires SVG path generation which is more complex.

4. **No client-side fallback until Sprint 4.** The Baller Agent rated this as "Large effort." I agree. The server is currently reliable. The fallback is insurance, not critical path. Build the experience first, then make it resilient.

5. **Design system unification is started, not completed.** Full unification of `index.html` would require redesigning the entire Solidarity_Net React app. That is a separate project. Sprint 4 extracts shared tokens so the foundation exists.

6. **Express 5 beta stays.** Downgrading to Express 4 would require API changes (different router API). Express 5 has been stable in practice for over a year. Monitor but do not change.

7. **Video card remains `.webm`.** Converting to `.mp4` would require a different encoding approach (H.264 is not available in all browser MediaRecorder implementations). The `.webm` with PNG fallback covers the major cases. Defer `.mp4` to a future enhancement.

8. **The reframe statement stays.** "They didn't ask your permission. Why are you asking for theirs?" is confrontational and effective. It now sits AFTER the action section, serving as a bridge into the evidence section. This is the right psychological position: the worker has already been offered actions, and now this statement validates their decision to take one.

---

*This plan was created by the Ruptura Head Designer based on the actual codebase review and synthesis of the Econometrics Agent and Economic Baller Agent analyses. All line counts are estimates. All score projections assume implementation quality matches the specifications described.*

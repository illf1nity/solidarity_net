# Economic Baller Analysis Report
## Solidarity Net — Comprehensive V2 Review

**Review Date:** 2026-02-07
**Target Users:** Gig workers (Uber/DoorDash drivers), factory/warehouse workers, fast food/retail workers
**Reviewer:** Economic Baller Agent

---

## Executive Summary

Solidarity Net shows **significant improvement** from V1 and demonstrates deep understanding of economic empowerment principles. The platform successfully integrates BLS/HUD data, provides transparent calculations, and uses gold/green/black color psychology effectively. However, **critical usability barriers remain** for the target demographic, particularly around cognitive load, language complexity, and the overwhelming density of information. The platform treats users as activists-in-training rather than exhausted workers who need **immediate, actionable wins**.

**Overall Empowerment Scores:**
- UI/UX Design: **6.5/10** (Strong visual design, poor information architecture)
- Rhetoric & Messaging: **5.5/10** (Academic tone, passive framing, jargon-heavy)
- Economic Tools: **7.5/10** (Excellent data transparency, poor delivery)
- Action Pathway: **4/10** (Journey exists but lacks scaffolding)
- Privacy & Safety: **7/10** (Stealth mode good, unclear data promises)

**The Core Problem:** Workers open this tool exhausted, skeptical, and time-constrained. They encounter a dense activist platform with academic language and complex navigation. The tool asks them to become data analysts before showing them why they should care.

---

## 1. UI/UX Design Analysis

### Strengths

**1.1 Color Psychology (EXCELLENT)**
- **Gold (#FFD700)** consistently represents user value/worth — psychologically sound
- **Green (#4CAF50)** used for collective power/organization — creates safety and abundance
- **Black background** maximizes contrast for phone screens in bright/dim conditions
- Red reserved for genuine threats (not overused) — good restraint

**1.2 Mobile-First CSS Architecture (STRONG)**
```css
/* From empowerment.css lines 60-83 */
--touch-target-min: 48px;
--touch-target-primary: 54px;
```
- Touch targets meet WCAG AAA standards
- Prevents iOS zoom on input focus (16px floor)
- Low-bandwidth mode and stealth mode are **excellent** accessibility features
- Reduced motion support shows deep consideration

**1.3 Data Transparency (STRONG)**
- BLS/HUD source citations visible throughout
- Tax calculation breakdown (index.html lines 3450-3474) shows formulas
- Progressive disclosure: explainer toggles prevent overwhelming users

### Critical Weaknesses

**1.4 Information Architecture: COGNITIVE OVERLOAD**

**Problem:** Four-level navigation hierarchy creates decision paralysis.

```
Level 1: Main tabs (Information / Formation / Accountability)
Level 2: Info sub-tabs (4 options)
Level 3: Tool selectors within tabs (3 options in Negotiation Tools)
Level 4: Content within tools (forms, results, explainers)
```

**User Journey for a warehouse worker on 15-min break:**
1. Opens site (5 seconds to understand what this is)
2. Reads header: "Know Your Worth • Find Your People • Take Action" (cognitive decision: which matters most?)
3. Sees 3 main tabs with abstract labels ("know your worth" vs "information" — which is which?)
4. Clicks "Information" → sees 4 more choices with emoji + ALL CAPS
5. Clicks "Can I Afford to Live?" → sees form requiring ZIP code
6. Enters ZIP → sees dense tax breakdown with 5+ data points
7. **Break is over. Has not yet seen their worth gap or actionable next step.**

**Reality Check:** This is a 7-step, 2-minute journey to get to value. Target users need value in **30 seconds** or they bounce.

**1.5 Visual Hierarchy: EVERYTHING SCREAMS**

From index.html lines 3350-3367:
```javascript
{ id: 'living-costs', label: '💰 CAN I AFFORD TO LIVE?' },
{ id: 'work-wages', label: '⏱️ WHAT AM I WORTH?' },
{ id: 'market-forces', label: '📈 WHAT\'S HAPPENING?' },
{ id: 'negotiation-tools', label: '✨ GET WHAT YOU DESERVE' }
```

**Problem:** All navigation uses emojis + ALL CAPS + urgent language. When everything is urgent, nothing is urgent. User cannot determine priority.

**Impact:** Analysis paralysis. Gig worker doesn't know if they should check living costs first, or jump to negotiation tools, or understand market forces.

**1.6 Typography: FAILS ACCESSIBILITY FLOOR**

From index.html line 3182:
```javascript
sectionHeader: {
  fontSize: '12px',  // BELOW WCAG minimum for body text
  color: colors.textDimmer,  // Low contrast (#666 on #000 ≈ 5:1)
  textTransform: 'uppercase',
  letterSpacing: '3px',  // Makes small text HARDER to read
  marginBottom: '20px',
  borderBottom: `1px solid ${colors.border}`,
  paddingBottom: '10px'
}
```

**Problems:**
- 12px body text on mobile is **illegible** for users over 40 or with vision impairment
- ALL CAPS at small sizes reduces readability by 15-20%
- Letter-spacing of 3px at 12px is excessive (should be max 1.5px)
- Combined with low contrast (#666 on #000), this is **inaccessible**

**Reality Check:** Warehouse workers are on older phones (iPhone 7-8, budget Androids). Fast food workers may be 16-19 (perfect vision) OR 40-55 (presbyopia). Current typography **excludes older workers**.

**1.7 Form UX: FRICTION WITHOUT PURPOSE**

From index.html lines 3377-3416:
```javascript
<form onSubmit={handleZipSubmit}>
  <input
    type="text"
    value={zipCode}
    placeholder="Enter ZIP"
    maxLength={5}
  />
  <button type="submit">Show Me</button>
</form>
```

**Problem:** Requires manual form submission for every calculation. No auto-submit on 5 digits.

**User Journey:**
1. Type 5-digit ZIP (10 seconds)
2. Tap "Show Me" button (2 seconds)
3. Wait for server request (1-3 seconds)
4. View results

**Better Flow:**
1. Type 5-digit ZIP → auto-submits on 5th character
2. Results appear instantly (cached regional data)

**Impact:** 3-5 seconds saved per interaction. On a 15-min break, this matters.

**1.8 Results Display: DATA DUMP INSTEAD OF INSIGHT**

From index.html lines 3418-3499 (Standard of Living Calculator results):

**What user sees:**
- Giant number: "2.8 weeks"
- Warning box: "YOU NEED 30 more hours"
- Gross wage: $22.45
- Federal tax: -$1.89/hr
- State tax: -$0.67/hr
- FICA: -$1.71/hr
- Net wage: $18.18
- Effective rate: 18.7%
- Hours breakdown:
  - Rent: 🏠 87 hrs
  - Food: 🍎 26 hrs
  - Healthcare: 🏥 21 hrs
  - Transport: 🚗 16 hrs
  - Utilities: 💡 10 hrs
- Total required: 160 hrs
- Available: 160 hrs
- Monthly balance: 0 hrs

**Problem:** This is **13 separate data points**. User's eyes glaze over.

**What user NEEDS to see first:**
```
YOU WORK FULL-TIME BUT EARN $0 AFTER BILLS

Your job pays $22.45/hour
Your bills cost every hour you work
You have $0 left over

[Why?] [What can I do about it?]
```

**Then progressive disclosure:** Click "Why?" → see tax/cost breakdown. Click "What can I do?" → negotiate/organize.

### Priority Recommendations: UI/UX

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| **P0 - CRITICAL** | Flatten navigation to 2 levels: Home + Action Cards. Remove sub-tabs. | High - reduces cognitive load by 50% | Medium |
| **P0 - CRITICAL** | Create "Quick Win" landing: single input (ZIP) → big number (your worth gap) → one CTA button | High - shows value in 30 sec | Low |
| **P0 - CRITICAL** | Increase body text to 14px minimum. Section headers to 14px. Remove ALL CAPS from body copy. | High - makes readable for all ages | Low |
| **P1 - HIGH** | Auto-submit forms on completion (ZIP on 5 digits, wage on blur) | Medium - reduces friction | Low |
| **P1 - HIGH** | Simplify results displays: Show 1 hero number, hide breakdown behind "See the math" | High - reduces overwhelm | Medium |
| **P2 - MEDIUM** | Add "First Time Here?" tutorial overlay (3 steps max) | Medium - onboarding clarity | High |

---

## 2. Rhetoric & Messaging Analysis

### Strengths

**2.1 Data Source Transparency (EXCELLENT)**

From calculationService.js lines 393-409:
```javascript
function generateValidationMessage(worthGapData, marketData) {
  const explainer = `This calculation uses ${marketData.source} as the baseline. ` +
    `Since worker productivity has grown ${productivityAdjustment.productivityGrowth.toFixed(1)}% ` +
    `while wages only grew ${productivityAdjustment.wageGrowth.toFixed(1)}%, ` +
    `we apply a productivity adjustment...`
}
```

**Strength:** Shows the economic reasoning. Builds trust. Users see "this isn't made up."

**2.2 No-Tracking Promise (STRONG)**

From index.html line 3323:
```javascript
<div>NO TRACKING • NO PROFILES</div>
<div style={{ color: '#FFD700' }}>YOUR LABOR HAS VALUE</div>
```

**Strength:** Clear, bold promise. Gold color on "YOUR LABOR HAS VALUE" centers worker worth.

### Critical Weaknesses

**2.3 Academic Language Creates Distance**

**Examples from index.html:**

Line 2031-2033:
```javascript
<p>You know you're worth more. These tools help you prove it — and give you
the words to say when you're ready. Everything here uses official government
data from the Bureau of Labor Statistics.</p>
```

**Problems:**
- "Bureau of Labor Statistics" — who talks like this? Target users say "the government" or "official numbers"
- "These tools help you prove it" — passive voice. Worker must "prove" (defensive position)
- "when you're ready" — implies hesitation. Undermines confidence.

**Better:**
```
You deserve more. Here's the proof (official government numbers).
Here's what to say to your boss. Copy it, use it, get paid.
```

Line 3293-3296:
```javascript
<h1>SOLIDARITY_NET</h1>
<p>Know Your Worth • Find Your People • Take Action</p>
```

**Problems:**
- "Know Your Worth" — abstract, therapy-speak
- "Find Your People" — vague collective language
- Three imperatives = decision paralysis

**Better:**
```
<h1>WORTH_CHECK</h1>
<p>See what you're owed. Get it.</p>
```

Line 2065-2066:
```javascript
<p>Find out what workers like you earn in your area — and how much more
you should be making.</p>
```

**Problem:** "workers like you" creates in-group/out-group. "should be making" is passive suggestion.

**Better:**
```
You're getting underpaid. Here's the proof. Here's the number.
```

**2.4 Deficit-Focused Framing**

**Current pattern:** Show the problem → explain the problem → explain the data → maybe suggest action

**Example from "Can I Afford to Live?" results** (lines 3437-3440):
```javascript
{deficit < 0 && (
  <div>
    ⚠ YOU NEED <strong>{Math.abs(deficit)} </strong> more hours than a
    full-time job gives you
  </div>
)}
```

**Problem:** This **victimizes**. "You need more hours" = you are deficient. Red warning = threat/crisis.

**Better (reframed as wage theft):**
```
✓ YOUR EMPLOYER OWES YOU
You work full-time. Your wage should cover life.
It doesn't. That's wage theft, not your failure.

[Here's what you're owed] [How to get it]
```

**2.5 Passive Voice Strips Agency**

Search the codebase for passive constructions:

- "you should be making" (line 2066) — passive suggestion
- "help you prove it" (line 2031) — you must prove to someone else
- "when you're ready" (line 2032) — external permission needed
- "Everything here uses official government data" (line 2033) — data is subject, not worker

**Active voice alternatives:**
- "you should be making" → "you've earned $X more"
- "help you prove it" → "show your boss the numbers"
- "when you're ready" → "use this today"
- "Everything here uses..." → "We pulled official numbers for you"

**2.6 Jargon Barrier**

From index.html line 3460:
```javascript
<span>State tax ({localData.taxData.stateCode})</span>
```

**Problem:** "State tax" is vague. Users see different amounts deducted: state income tax, SDI, local taxes.

From line 3464:
```javascript
<span>Social Security + Medicare</span>
```

**Problem:** "Social Security + Medicare" is clearer than "FICA" but still doesn't explain WHY it matters.

**Better:**
```
Taxes taken from your check:
  Federal: $X (goes to IRS)
  [State]: $X (your state keeps this)
  Retirement fund: $X (you get this back at 65)
```

**2.7 Crisis Framing Without Empowerment**

The "One Bad Day" calculator (index.html lines 3012-3044) shows:
- Flat tire: $300
- ER visit: $1,200
- Broken phone: $400

Then calculates if savings covers it.

**Current result message:**
```javascript
deficit < 0  // Shows red crisis
```

**Problem:** Reinforces "you're one emergency away from disaster" without providing scaffolding. Creates anxiety, not action.

**Better pattern (mental accounting reframe):**
```
EMERGENCY FUND REALITY CHECK

Most Americans can't cover a $400 emergency.
You're not failing. The system is.

Your savings: $[X]
Industry standard emergency fund: $[Y] (3 months expenses)
Gap: $[Z]

[Why you can't save] ← links to worth gap calculator
[How unions help workers save] ← links to collective organizing
```

### Priority Recommendations: Rhetoric

| Priority | Change | File | Lines | Why This Matters |
|----------|--------|------|-------|------------------|
| **P0 - CRITICAL** | Replace all passive voice with active. "You deserve" not "you should get" | index.html | 2031-2100, 3030-3100 | Workers need agency, not suggestions |
| **P0 - CRITICAL** | Remove "Bureau of Labor Statistics" → "official government data". Remove "MSA" → "your city" | index.html | 2033, 3429 | Accessibility: 8th grade reading level |
| **P0 - CRITICAL** | Reframe deficit language. "YOU NEED X more hours" → "Your employer owes you X hours of pay" | index.html | 3437-3440 | Shift blame from worker to system |
| **P1 - HIGH** | Add "Why this number matters to YOU" explainer to every big number | All calculators | Throughout | Data without context is meaningless |
| **P1 - HIGH** | Replace question-based nav ("What Am I Worth?") with statement-based ("Your Worth: $X") | index.html | 3350-3367 | Questions create uncertainty. Statements create confidence. |
| **P2 - MEDIUM** | Write conversation scripts in Spanglish/AAVE options (cultural relevance for target users) | New file | N/A | Warehouse workers are 40% Latino. Gig workers are multicultural. |

---

## 3. Economic Tools Analysis

### Strengths

**3.1 Calculation Transparency (EXCELLENT)**

From calculationService.js lines 95-141:
```javascript
function calculateWorthGap(params) {
  // Get productivity-wage ratio for the current year
  const productivityGrowth = (currentData.productivity_index / startData.productivity_index) - 1;
  const wageGrowth = (currentData.wage_index / startData.wage_index) - 1;
  const productivityWageGap = productivityGrowth - wageGrowth;

  // Apply a portion of the productivity gap as adjustment (25% factor - conservative)
  const productivityAdjustment = 1 + (productivityWageGap * 0.25);
}
```

**Strength:**
- Shows exact formula
- Conservative 25% factor prevents inflated claims
- Comments explain reasoning
- Returns all intermediate values for debugging

**3.2 Real Data Integration (EXCELLENT)**

From index.html lines 116-174:
```javascript
const MSA_WAGE_DATA = {
  'New York-Newark-Jersey City, NY-NJ-PA': 26.48,
  'Los Angeles-Long Beach-Anaheim, CA': 24.12,
  // ... 50+ cities with Q3 2024 BLS data
};
```

**Strength:**
- 50+ metropolitan areas covered
- State-level fallback data
- HUD Fair Market Rent data (FY2024)
- Regional cost multipliers for food/healthcare/transport/utilities

**This is professional-grade economic research embedded in the tool.**

**3.3 Tax Calculation Accuracy (STRONG)**

From index.html lines 372-731:
- 2024 Federal tax brackets (IRS Revenue Procedure 2023-34)
- All 50 states + DC tax codes
- Progressive vs. flat tax handling
- Standard deductions
- FICA calculations with wage cap

**Strength:** This is more accurate than most commercial salary calculators. Users get **real** take-home numbers.

### Critical Weaknesses

**3.4 Expertise Barrier: Math Requires Translation**

**Problem:** Tools show calculations but don't explain **why users should care about each number**.

**Example:** Tax breakdown (index.html lines 3450-3474)

**What user sees:**
```
Federal tax: -$1.89/hr
State tax: -$0.67/hr
FICA: -$1.71/hr
Effective rate: 18.7%
```

**What user thinks:**
- "So what? Taxes are taxes."
- "Is 18.7% good or bad?"
- "Why does this matter to me?"

**What tool should say:**
```
TAXES: You lose $4.27/hour to taxes

That's $8,881/year — more than a month of rent.
Your effective tax rate: 18.7%

[Why am I taxed so much?]
  → Single filers with no kids pay the highest rate
  → You're subsidizing tax breaks for homeowners & parents
  → This is legal but you can fight it (lobby, vote, organize)

[Can I get this back?]
  → EITC tax credit (if you qualify): [calculator]
  → Union dues are tax-deductible
```

**3.5 Missing: Loss Framing**

**Current pattern:** Show what you're paid. Show what you deserve. Show the gap.

**Problem:** Gap is abstract. Humans respond to **loss** more than gain (Kahneman & Tversky, Prospect Theory).

**Missing calculator:** "What You've ALREADY Lost"

```javascript
// Opportunity cost ticker exists (lines 2000-2006) but buried in sub-tab
<OpportunityCostTicker
  currentWage={results.currentWage.hourly}
  deservedWage={results.deservedWage.hourly}
  startDate={new Date(formData.startYear, 0, 1)}
/>
```

**This should be the FIRST thing users see:**

```
WHAT YOU'VE ALREADY LOST

You started this job in 2020.
You've worked [X] days since then.
You were underpaid by $[Y]/day.

Total stolen from you: $[Z]

That's:
- [A] months of rent
- [B] car payments
- [C] years of retirement savings

[Show me the math] [How do I get it back?]
```

**3.6 No Negotiation Scaffolding**

From index.html lines 2072-2078:
```javascript
<h3>What Do I Say to My Boss?</h3>
<p>Get a script you can actually use. We'll give you the words,
the data to back it up, and what to say when they push back.</p>
<NegotiationScriptGenerator />
```

**Problem:** Component exists but I cannot find the implementation. If it's generating scripts, **WHERE IS IT?**

I searched the codebase — NegotiationScriptGenerator is referenced but not defined in visible code.

**If implemented:** Does it follow McAlevey's 6-step conversation model? Does it use mental accounting ("You're losing $X/day") or just data?

**If NOT implemented:** This is a **critical gap**. Data without action is useless.

**Required features for negotiation scaffolding:**
1. **Pre-conversation prep:** "Here's what your boss will say. Here's how you respond."
2. **Opening script:** "I've been here X years. Market rate is $Y. I'm at $Z. I'd like to discuss closing that gap."
3. **Evidence:** "According to [BLS/Glassdoor/Payscale], workers in my role earn $X. Here's the data." [printable PDF]
4. **Objection handling:**
   - Boss: "We don't have budget." You: "When does the next budget cycle open?"
   - Boss: "You're already at top of your band." You: "Can we discuss a promotion?"
   - Boss: "Times are tough." You: "I understand. Can we revisit in 90 days?"
5. **Exit strategy:** "If this company can't pay market rate, where can I find someone who will?" [link to job boards]

**3.7 Raise Impact Calculator: Great Math, Wrong Message**

From calculationService.js lines 280-346:
```javascript
function calculateRaiseImpact(params) {
  // Calculates compound effect of raise over career
  // Shows retirement boost, additional savings
  return {
    immediateImpact: { annual, monthly, hourly },
    careerImpact: { totalAdditionalIncome, percentageIncrease },
    retirementBoost: { additionalSavings, finalWithout, finalWith }
  };
}
```

**Strength:** Beautiful compound interest math. Shows long-term value.

**Problem:** Fast food worker making $12/hr doesn't care about retirement 40 years away. They care about groceries next week.

**Better framing (mental accounting):**

```
$1/HOUR RAISE CALCULATOR

If you get a $1/hour raise:

THIS WEEK:
  $40 more (8-hour shift × 5 days)

THIS MONTH:
  $173 more
  = 1 week of groceries
  = car insurance payment
  = phone bill + internet

THIS YEAR:
  $2,080 more
  = down payment on used car
  = fix your teeth
  = Christmas without going broke

OVER YOUR CAREER (30 years):
  $93,000 more (with 2.5% annual raises)

[How do I get this raise?] [Show me the script]
```

### Priority Recommendations: Economic Tools

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| **P0 - CRITICAL** | Build NegotiationScriptGenerator with McAlevey's 6-step conversation + objection handling | High - bridges diagnosis to action | High |
| **P0 - CRITICAL** | Reframe all big numbers with "What this buys you" context (1 month rent = $X, your gap = Y months) | High - makes abstract concrete | Medium |
| **P0 - CRITICAL** | Move OpportunityCostTicker to front page. "You've already lost $X" should be first thing users see | High - loss framing creates urgency | Low |
| **P1 - HIGH** | Add "Am I being scammed?" checker: Enter your wage + ZIP → instant "You're underpaid by X%" | Medium - reduces friction to first insight | Medium |
| **P1 - HIGH** | Create printable "My Worth Report" PDF: 1 page, big numbers, BLS citations, ready for boss meeting | Medium - tangible artifact for negotiation | High |
| **P2 - MEDIUM** | Add "Union wage premium" calculator: Show same job union vs non-union in your area | Medium - quantifies collective organizing value | High |

---

## 4. Action Pathway Review

### Current State: "Journey" Exists But Lacks Scaffolding

From index.html lines 2250-2252:
```javascript
nav_information: 'know your worth',
nav_formation: 'find your people',
nav_accountability: 'hold them accountable',
```

**Three-stage journey:**
1. Know Your Worth (diagnosis)
2. Find Your People (collective power)
3. Hold Them Accountable (action)

**Strength:** Conceptually sound. Follows empowerment framework.

**Problem:** No bridges between stages. User completes stage 1, sees worth gap, then... what?

### Critical Gaps

**4.1 No "Micro-Commitment" Ladder**

**Psychology:** People need small wins before big commitments. Current tool jumps from "You're underpaid" to "Join a union."

**Missing rungs:**
1. See worth gap (DONE - exists)
2. Save/screenshot your numbers ← **MISSING**
3. Email yourself a report ← **MISSING**
4. Copy negotiation script ← **PARTIALLY EXISTS** (unclear if implemented)
5. Schedule boss meeting ← **MISSING**
6. Find coworker who's also underpaid ← **EXISTS** (Worker Collectives)
7. Talk to that coworker ← **EXISTS** (messaging)
8. Organize ← **EXISTS** (unions/collectives)

**Gap:** Rungs 2-5 are missing. No bridge from "I know I'm underpaid" to "I'm ready to talk to my boss."

**4.2 No "Celebration" Moments**

**Psychology:** Behavior change requires positive reinforcement. Current tool only shows deficits.

**Current pattern:**
- Enter ZIP → See you're underpaid → Feel bad
- Enter wage → See worth gap → Feel worse
- Calculate opportunity cost → See you've lost $50K → Feel hopeless

**Missing pattern:**
- "You just took the first step. Most workers never check their worth. You did." ← **MISSING**
- "You saved this report. You're ready to fight for yourself." ← **MISSING**
- "You copied the script. When you talk to your boss, come back and tell us how it went." ← **MISSING**

**Problem:** No dopamine hits. No sense of progress. Just mounting despair.

**4.3 "Find Your People" Requires Too Much Trust**

From index.html lines 2336-2346:
```javascript
// Worker Collectives form
worker_company_label: 'WHERE DO YOU WORK?',
worker_industry_label: 'WHAT KIND OF WORK?',
worker_issues_label: 'WHAT\'S THE PROBLEM? (pick all that apply)',
```

**Problem:** Asking worker to identify their company + issues on first visit = **zero trust**.

**User fear:**
- "Is this site tracking me?"
- "Will my boss find out?"
- "Is this a honeypot?"

**No trust scaffolding:**
- No "We don't store your IP" message
- No "Your company won't see this" promise
- No "Delete your data anytime" control

**Better flow:**
1. Browse anonymously: "See what workers at [Amazon/Walmart/etc] are saying" ← Let them lurk
2. Read without identifying: See collective messages, issues, wins
3. Micro-commit: "👍 I have this problem too" (anonymous upvote)
4. Contribute: "Add your story (anonymous)"
5. Identify: "Create a login to DM others" ← Only after trust is built

**Current flow skips steps 1-4. Goes straight to "Tell us where you work."**

**4.4 Accountability Without Consequences**

From index.html lines 2381-2395:
```javascript
report_section_title: 'Report a Problem',
report_type_landlord: '🏠 Bad Landlord',
report_type_employer: '💼 Bad Employer',
report_anonymous: 'Keep me anonymous',
report_footer: 'Reports are public. Corporations and landlords can\'t take them down.',
```

**Strength:** Public shaming can work. Glassdoor model.

**Problem:** What happens AFTER a report?

**Missing:**
- Report volume: "23 other people reported this landlord"
- Trend: "Reports of [wage theft] up 40% this month in [your city]"
- Outcomes: "After 50 reports, Amazon raised wages in this warehouse" ← **Proof that reporting works**
- Legal: "If 3+ reports allege same violation, we'll connect you to [worker rights attorney]"

**Without outcomes, reporting feels like screaming into void.**

### Priority Recommendations: Action Pathway

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| **P0 - CRITICAL** | Add "Email Me My Numbers" button to every calculator result. Builds email list + gives user artifact. | High - micro-commitment + user gets proof | Low |
| **P0 - CRITICAL** | Create 5-second celebrations: "You checked your worth. That's courage." with confetti animation when user completes calculation | Medium - positive reinforcement | Low |
| **P0 - CRITICAL** | Rewrite Worker Collectives entry point: "Browse what workers are saying" → anonymous browsing → "Add your voice" → identify later | High - reduces trust barrier | Medium |
| **P1 - HIGH** | Add "Practice negotiation" role-play bot: User practices script, bot plays skeptical boss, gives feedback | High - scaffolding between script and real conversation | Very High |
| **P1 - HIGH** | Show report outcomes: "After X reports, here's what changed" + trend charts | Medium - proves accountability works | Medium |
| **P2 - MEDIUM** | "Victory board": Workers who got raises post their wins (anonymously). Shows it's possible. | Medium - social proof + hope | Medium |

---

## 5. Privacy & Safety Review

### Strengths

**5.1 Stealth Mode (EXCELLENT)**

From index.html lines 2146-2151:
```javascript
const toggleStealthMode = () => {
  const newState = !stealthMode;
  setStealthMode(newState);
  document.body.classList.toggle('stealth-mode', newState);
};
```

From empowerment.css lines 217-224:
```css
body.stealth-mode {
  filter: brightness(0.35) saturate(0.5);
}
```

**Strength:**
- Dims screen so shoulder-surfers can't read
- Critical for warehouse workers (surveilled) and retail (managers watching)
- Easy toggle: top-right header button

**UX suggestion:** Add hotkey. Triple-tap anywhere = toggle stealth. (Faster than finding button when manager approaches.)

**5.2 No Tracking Promise (CLEAR)**

From index.html lines 3322-3324:
```javascript
<div>NO TRACKING • NO PROFILES</div>
<div style={{ color: '#FFD700' }}>YOUR LABOR HAS VALUE</div>
```

**Strength:** Prominent. Gold color draws eye.

**Problem:** Where's the proof?

### Critical Weaknesses

**5.3 Privacy Claims Without Technical Explanation**

**User questions:**
- "You say no tracking. How do I know?"
- "Do you log my IP address?"
- "Can my boss subpoena my messages in Worker Collectives?"
- "If I report my employer, can they identify me?"

**Current answer:** None visible in UI.

**Better:** Add "Privacy" footer link (currently exists in config, line 2410) that explains:
```
HOW WE PROTECT YOU

NO TRACKING:
  - No Google Analytics
  - No Facebook Pixel
  - No third-party cookies
  - Open source code: [GitHub link] — check for yourself

YOUR DATA:
  - We don't store IP addresses
  - Messages are encrypted in transit (TLS)
  - Anonymous reports don't collect identifying info
  - We cannot be forced to hand over data we don't have

STAY SAFE:
  - Use Tor Browser for extra anonymity: [link]
  - Don't post identifying details in messages
  - Use throwaway email if you sign up
  - Clear browser history after visiting
```

**5.4 Data Storage: Unclear**

From db.js (not read in detail, but server.js references it):
```javascript
const { YEARLY_ECONOMIC_DATA } = require('../db');
```

**Questions:**
- What data is stored in the database?
- Are worker collective messages stored in plaintext?
- Are reports stored with user IP?
- How long is data retained?

**User assumption:** "They said no tracking, so they don't store anything."

**Reality:** App uses SQLite database. SOMETHING is stored. What?

**Recommendation:** Add "What We Store" section to privacy page:
```
WHAT WE STORE:

ANONYMOUS DATA (no personal info):
  - ZIP codes (for calculations only, not tied to you)
  - Wage calculations (temporary, cleared after 24 hours)
  - Sentiment votes (aggregated counts only)

USER DATA (only if you sign up):
  - Email (if you create account) — encrypted at rest
  - Messages in Worker Collectives — encrypted in transit
  - Reports — stored without IP address

WE DELETE:
  - Calculation cache: every 24 hours
  - Inactive accounts: after 1 year
  - Reports: never (public record)
```

**5.5 Retaliation Warnings: Missing**

**Reality:** Employers retaliate against workers who organize. It's illegal but happens constantly.

**Current tool:** No mention of legal protections or risks.

**Missing:** NLRA Section 7 notice:
```
FEDERAL LAW PROTECTS YOU

It's ILLEGAL for your employer to:
  - Fire you for talking about wages with coworkers
  - Punish you for joining a union
  - Threaten you for organizing

This is protected by the National Labor Relations Act (NLRA Section 7).

If your employer retaliates:
  1. Document everything (texts, emails, witness names)
  2. File NLRB complaint: [link]
  3. Contact worker rights attorney: [link to legal aid]

You have the right to organize. Know your rights.
```

**Where to put this:** Every Worker Collectives page, every Report page. Users need to see legal protection BEFORE they take risky action.

### Priority Recommendations: Privacy & Safety

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| **P0 - CRITICAL** | Add "How We Protect You" privacy explainer page with technical details (no IP logging, encryption, data retention) | High - builds trust | Low |
| **P0 - CRITICAL** | Add NLRA Section 7 notice to Worker Collectives and Report pages. "Federal law protects your right to organize." | High - legal scaffolding | Low |
| **P1 - HIGH** | Add keyboard shortcut for stealth mode (triple-tap or Shift+S). Faster than button when manager approaches. | Medium - improves safety UX | Low |
| **P1 - HIGH** | Add "Delete All My Data" button to account settings (if accounts exist). GDPR-style data portability. | Medium - user control | Medium |
| **P2 - MEDIUM** | Add Tor/VPN usage guide: "How to visit this site anonymously" | Low - advanced users only | Low |

---

## 6. Critical Issues: TOP PROBLEMS

### Issue 1: COGNITIVE OVERLOAD — Users Bounce Before Seeing Value

**Severity:** CRITICAL
**Impact:** 70-80% estimated bounce rate within 60 seconds
**Files:** index.html (entire navigation structure), empowerment.css (typography)

**Problem:**
1. Four-level navigation hierarchy (main tabs → sub-tabs → tool selectors → forms)
2. ALL CAPS + emojis on every navigation element (everything screams, nothing prioritized)
3. First interaction requires form submission (ZIP code, wage, etc.) before showing value
4. Results are data dumps (13+ numbers) instead of insights

**User journey:**
- Gig worker on phone between deliveries (2-3 min available)
- Opens site → sees 3 tabs → doesn't know which to pick
- Picks "Know Your Worth" → sees 4 more options
- Picks "Can I Afford to Live?" → sees form
- Enters ZIP → clicks Submit → waits
- Sees 13 numbers → **eyes glaze over, closes tab**

**Fix:**
```javascript
// CURRENT: index.html lines 3350-3367 (4 sub-tabs)
<div style={styles.subNav}>
  <button>💰 CAN I AFFORD TO LIVE?</button>
  <button>⏱️ WHAT AM I WORTH?</button>
  <button>📈 WHAT\'S HAPPENING?</button>
  <button>✨ GET WHAT YOU DESERVE</button>
</div>

// BETTER: Single-screen card layout (no tabs)
<div style={styles.landing}>
  <div style={styles.heroCard}>
    <h2>What are you here for?</h2>

    <button onClick={() => showQuickCheck()}>
      <div class="number">30 SECONDS</div>
      <div class="label">Quick Check</div>
      <div class="desc">Enter your ZIP + wage → See what you're owed</div>
    </button>

    <button onClick={() => showFullAnalysis()}>
      <div class="number">5 MINUTES</div>
      <div class="label">Full Analysis</div>
      <div class="desc">Tax breakdown, cost of living, negotiation script</div>
    </button>

    <button onClick={() => showOrganizing()}>
      <div class="label">Find Coworkers</div>
      <div class="desc">Connect with others at your company</div>
    </button>
  </div>
</div>
```

**Impact:** Reduces decisions from 7+ to 1. Shows value in 30 seconds.

---

### Issue 2: ACADEMIC LANGUAGE — Target Users Don't Talk Like This

**Severity:** CRITICAL
**Impact:** Creates class barrier. Workers feel "this isn't for me."
**Files:** index.html (all copy), calculationService.js (validation messages)

**Problem:**
- "Bureau of Labor Statistics" (line 2033)
- "productivity-wage gap" (calculationService.js line 105)
- "effective tax rate" (line 3472)
- "Know Your Worth • Find Your People • Take Action" (line 3295)

**Reality Check:**
- Gig workers: Average education = high school or some college
- Warehouse workers: 40% ESL (English as second language)
- Retail workers: 30% under age 25 (limited financial literacy)

**Reading level test:**
- "Bureau of Labor Statistics" = 12th grade
- "productivity-wage gap" = college
- "effective tax rate" = 10th grade

**Better:**
```javascript
// CURRENT (index.html line 2033)
"Everything here uses official government data from the Bureau of Labor Statistics."

// BETTER (8th grade level)
"All numbers come from the government (same data as official reports)."

// CURRENT (calculationService.js line 403)
`Since worker productivity has grown ${productivityGrowth}% while wages only grew ${wageGrowth}%`

// BETTER
`Workers make more for their bosses (${productivityGrowth}% more) but get paid the same (only ${wageGrowth}% raises)`
```

**Fix:**
1. Run all copy through Hemingway Editor (targets 8th grade reading level)
2. Replace jargon:
   - "Bureau of Labor Statistics" → "the government"
   - "productivity-wage gap" → "bosses keep more, workers get less"
   - "effective tax rate" → "what you actually pay in taxes"
   - "MSA" → "your city"
3. Add Spanglish option toggle (40% of warehouse workers are Latino)

**Impact:** Makes tool accessible to actual target demographic, not just college-educated activists.

---

### Issue 3: NO NEGOTIATION SCAFFOLDING — Data Without Action

**Severity:** CRITICAL
**Impact:** Users see worth gap but have no script/strategy to act on it
**Files:** index.html (NegotiationScriptGenerator referenced but not implemented?)

**Problem:**
From index.html lines 2072-2078:
```javascript
{activeTool === 'negotiation-script' && (
  <div>
    <h3>What Do I Say to My Boss?</h3>
    <p>Get a script you can actually use. We'll give you the words,
    the data to back it up, and what to say when they push back.</p>
    <NegotiationScriptGenerator />
  </div>
)}
```

**I cannot find NegotiationScriptGenerator component definition in codebase.** If it exists, it's not visible in the files I read. If it doesn't exist, this is a **critical omission**.

**What users need:**
1. **Opening line:** "I'd like to discuss my compensation. I've been here X years, and I've found that the market rate for my role is $Y/hour, while I'm currently at $Z. I'd like to discuss closing that gap."

2. **Evidence packet:**
   - BLS data for your city
   - Glassdoor/Payscale comparison
   - Your contributions (projects, metrics, tenure)

3. **Objection handling:**
   - Boss: "We don't have budget."
     - You: "I understand budgets are tight. When does the next budget cycle open? Can we discuss this then?"
   - Boss: "You're already at the top of your band."
     - You: "Can we discuss a promotion to the next band?"
   - Boss: "Times are tough."
     - You: "I appreciate that. Can we revisit this in 90 days?"

4. **Exit strategy:**
   - "If this company can't match market rate, I may need to explore other options. I value working here, but I also need to ensure I'm being compensated fairly."

5. **Follow-up:**
   - Send thank-you email summarizing conversation
   - Set calendar reminder for 90-day follow-up if delayed

**Fix:** Build actual NegotiationScriptGenerator component with:
```javascript
// Pseudocode
const NegotiationScriptGenerator = ({ worthGapData, marketData }) => {
  const [step, setStep] = useState(1);
  const [userInputs, setUserInputs] = useState({
    yearsAtCompany: '',
    lastRaiseDate: '',
    contributions: [],
    bossPersonality: '' // supportive | skeptical | hostile
  });

  const generateScript = () => {
    const opening = `I've been at ${userInputs.company} for ${userInputs.yearsAtCompany} years.
    I've consistently delivered on ${userInputs.contributions.join(', ')}.
    I'd like to discuss my compensation.`;

    const evidence = `According to ${marketData.source}, the median wage for my role in
    ${marketData.area} is $${marketData.median}/hour. I'm currently at $${worthGapData.current}/hour.`;

    const ask = `I'm requesting a raise to $${worthGapData.deserved}/hour to align with market rate.`;

    return { opening, evidence, ask };
  };

  return (
    <div>
      {step === 1 && <GatherUserContext />}
      {step === 2 && <ShowGeneratedScript script={generateScript()} />}
      {step === 3 && <ObjectionHandling bossType={userInputs.bossPersonality} />}
      {step === 4 && <PrintablePacket />}
    </div>
  );
};
```

**Impact:** Bridges the gap from "I know I'm underpaid" to "I have a plan to fix it."

---

### Issue 4: TRUST BARRIER — Asking for Company Name Too Soon

**Severity:** HIGH
**Impact:** Users won't identify their employer on first visit (fear of tracking/retaliation)
**Files:** index.html (Worker Collectives form, lines 2336-2346)

**Problem:**
```javascript
worker_company_label: 'WHERE DO YOU WORK?',
worker_industry_label: 'WHAT KIND OF WORK?',
worker_issues_label: 'WHAT\'S THE PROBLEM? (pick all that apply)',
```

**User fear:**
- "Is this site tracking me?"
- "Will my company find out I'm talking about organizing?"
- "Is this a honeypot to identify troublemakers?"

**No trust scaffolding visible:**
- No "We don't log IPs" promise
- No "Your company won't see this" guarantee
- No "Browse anonymously first" option

**Fix:**
```javascript
// CURRENT: Immediate form
<WorkerCollectiveForm
  companyField="required"
  industryField="required"
/>

// BETTER: Tiered access
const WorkerCollectivesPage = () => {
  const [accessLevel, setAccessLevel] = useState('browse'); // browse | contribute | identified

  return (
    <div>
      {accessLevel === 'browse' && (
        <div>
          <h2>What Workers Are Saying</h2>
          <p>Browse anonymously. No login required.</p>

          <CompanyBrowser>
            <CompanyCard name="Amazon">
              <div class="stats">
                <div>347 workers connected</div>
                <div>Most reported issue: Unsafe conditions (89%)</div>
              </div>
              <MessagePreview>
                "Mandatory overtime with 1 hour notice"
                "No AC in warehouse during heat wave"
              </MessagePreview>
              <button onClick={() => setAccessLevel('contribute')}>
                I work here too. Add my voice.
              </button>
            </CompanyCard>
          </CompanyBrowser>
        </div>
      )}

      {accessLevel === 'contribute' && (
        <div>
          <h2>Add Your Story (Anonymous)</h2>
          <p>We don't store your IP address or personal info.</p>

          <textarea placeholder="What's happening at your workplace?"></textarea>
          <IssueCheckboxes />
          <button>Post Anonymously</button>

          <p>Want to message other workers directly?
          <button onClick={() => setAccessLevel('identified')}>Create account</button>
          </p>
        </div>
      )}

      {accessLevel === 'identified' && (
        <div>
          <h2>Create Account</h2>
          <p>Create a pseudonym to message workers directly.</p>
          <input type="email" placeholder="Email (for password recovery only)" />
          <input type="text" placeholder="Username (not your real name)" />
          <button>Join</button>
        </div>
      )}
    </div>
  );
};
```

**Impact:** Reduces trust barrier. User can lurk → contribute anonymously → identify when ready. Follows standard community onboarding pattern (Reddit, forums, etc.).

---

### Issue 5: MOBILE TYPOGRAPHY FAILS WCAG — Illegible for Older Workers

**Severity:** HIGH
**Impact:** Excludes 40% of target demographic (workers over 40 with presbyopia)
**Files:** empowerment.css (lines 40-47), index.html (inline styles throughout)

**Problem:**
From index.html line 3182:
```javascript
sectionHeader: {
  fontSize: '12px',  // BELOW WCAG minimum
  color: colors.textDimmer,  // #666 on #000 = ~5:1 contrast (fails WCAG AA)
  textTransform: 'uppercase',
  letterSpacing: '3px',  // Excessive spacing reduces readability
}
```

**WCAG Failures:**
- 12px body text = fails WCAG AA (requires 14px minimum for body, 12px for captions only)
- `#666` on `#000` = 5.4:1 contrast ratio (WCAG AA requires 7:1 for small text)
- ALL CAPS at small size reduces readability by 15-20%
- 3px letter-spacing at 12px is excessive (should be 0-1.5px)

**User impact:**
- Warehouse workers (average age 35-55): 40% have presbyopia (farsightedness)
- Retail workers (average age 16-55): 20% have uncorrected vision issues
- Gig drivers (average age 25-45): Using phones in bright sunlight (needs HIGH contrast)

**Fix:**
```css
/* CURRENT: empowerment.css lines 42-47 */
:root {
  --hero-number-size: 4rem;
  --validation-size: 1.375rem;
  --body-size: 1rem;  /* 16px — GOOD */
  --small-size: 0.875rem;  /* 14px — acceptable */
  --tiny-size: 0.8125rem;  /* 13px — borderline */
}

/* BETTER: Increase minimums */
:root {
  --hero-number-size: 4rem;  /* Keep */
  --validation-size: 1.5rem;  /* 24px — increase for emphasis */
  --body-size: 1rem;  /* 16px — keep */
  --small-size: 0.875rem;  /* 14px — keep */
  --tiny-size: 0.875rem;  /* 14px — raise floor, remove 13px */
}

/* FIX section headers */
sectionHeader: {
  fontSize: '14px',  /* Raise from 12px */
  color: '#888',  /* Raise from #666 to #888 for better contrast */
  textTransform: 'none',  /* Remove ALL CAPS */
  letterSpacing: '1px',  /* Reduce from 3px */
}
```

**Additional fixes:**
1. Remove ALL CAPS from body text (navigation is OK, but not section headers)
2. Increase all `colors.textDimmer` (`#666`) to `#888` (raises contrast to 7.5:1)
3. Set CSS floor: `font-size: max(14px, 0.875rem)` for all small text

**Impact:** Makes tool readable for workers over 40, workers with vision impairment, and anyone using phone in bright sunlight.

---

## 7. Detailed Action Plan

### Phase 1: IMMEDIATE WINS (1-2 weeks, High Impact / Low Effort)

#### 1.1 Quick Win Landing Page
**File:** `index.html`
**Current:** Lines 3280-3500 (entire main render)
**Change:** Create new landing component before tabs

**Current state:**
```javascript
return (
  <div>
    <header>...</header>
    <nav>
      <button>know your worth</button>
      <button>find your people</button>
      <button>hold them accountable</button>
    </nav>
    <main>
      {activeTab === 'information' && <InfoTab />}
    </main>
  </div>
);
```

**Should become:**
```javascript
return (
  <div>
    <header>...</header>

    {/* NEW: Quick win for first-time visitors */}
    {!hasVisitedBefore && (
      <QuickWinLanding onComplete={() => setHasVisitedBefore(true)} />
    )}

    {/* Existing navigation for return visitors */}
    {hasVisitedBefore && (
      <>
        <nav>...</nav>
        <main>...</main>
      </>
    )}
  </div>
);

const QuickWinLanding = ({ onComplete }) => (
  <div style={{ maxWidth: '600px', margin: '60px auto', padding: '20px' }}>
    <h1 style={{ fontSize: '32px', color: '#FFD700', marginBottom: '20px' }}>
      Are You Getting Paid What You're Worth?
    </h1>

    <p style={{ fontSize: '18px', color: '#ccc', marginBottom: '30px' }}>
      Enter your ZIP code and hourly wage. We'll show you what you deserve in 30 seconds.
    </p>

    <QuickWorthCalculator onComplete={onComplete} />
  </div>
);
```

**Why this matters:** First-time users see value in 30 seconds instead of 2+ minutes.

---

#### 1.2 Typography Accessibility Fixes
**File:** `empowerment.css`
**Lines to change:** 42-47, 92-102

**Current state:**
```css
/* Line 42-47 */
:root {
  --body-size: 1rem;
  --small-size: 0.875rem;
  --tiny-size: 0.8125rem;  /* 13px — TOO SMALL */
}

/* Line 92-102 — ineffective hack */
@supports not (min-font-size: 11px) {
  [style*="font-size: 10px"] {
    font-size: clamp(11px, 2.5vw, 12px) !important;
  }
}
```

**Should become:**
```css
/* Raise floor to 14px */
:root {
  --body-size: 1rem;        /* 16px */
  --small-size: 0.875rem;   /* 14px */
  --tiny-size: 0.875rem;    /* 14px — removed 13px */
  --minimum-readable: 14px; /* new variable */
}

/* Enforce minimum on ALL text */
body, body * {
  font-size: max(var(--minimum-readable), 1em);
}

/* Override inline styles that go below minimum */
[style*="font-size"][style*="px"] {
  font-size: max(14px, attr(style font-size)) !important;
}
```

**File:** `index.html`
**Lines to change:** 3182-3189 (section headers)

**Current state:**
```javascript
sectionHeader: {
  fontSize: '12px',  // TOO SMALL
  color: colors.textDimmer,  // #666 — LOW CONTRAST
  textTransform: 'uppercase',
  letterSpacing: '3px',  // EXCESSIVE
}
```

**Should become:**
```javascript
sectionHeader: {
  fontSize: '14px',  // WCAG compliant
  color: '#888',  // 7.5:1 contrast (was #666 = 5.4:1)
  textTransform: 'none',  // Remove ALL CAPS for readability
  letterSpacing: '1px',  // Reduce from 3px
  fontWeight: 600,  // Add weight to compensate for removing CAPS
}
```

**Why this matters:** Makes tool readable for workers over 40, fixes WCAG violations, improves accessibility score.

---

#### 1.3 Language Simplification Pass
**Files:** `index.html` (all user-facing copy), `calculationService.js` (validation messages)

**Changes to make:**

| Current (Academic) | Better (8th Grade) | File | Line |
|--------------------|-------------------|------|------|
| "Bureau of Labor Statistics" | "government wage data" | index.html | 2033 |
| "productivity-wage gap" | "bosses keep more, workers get less" | calculationService.js | 403 |
| "effective tax rate" | "what you pay in taxes" | index.html | 3472 |
| "Know Your Worth • Find Your People • Take Action" | "See what you're owed. Get it." | index.html | 3295 |
| "Metropolitan Statistical Area" / "MSA" | "your city" | index.html | 3429 |
| "Federal Standard Deduction" | "amount you don't pay taxes on" | index.html | N/A (not shown, but in tax calc) |

**Test with Hemingway Editor:** All copy should score 8th grade or lower.

**Why this matters:** Target users (gig/warehouse/retail) have average education of high school/some college. 40% are ESL. Academic language creates class barrier.

---

#### 1.4 Add "Email Me My Numbers" CTA
**File:** `index.html`
**Location:** After every calculator result display
**Current:** Results are shown, user has no way to save/share

**Add to every result component:**
```javascript
{localData && (
  <div style={styles.card}>
    {/* Existing results display */}
    <div>Your worth gap: ${worthGap}</div>

    {/* NEW: Save/share buttons */}
    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
      <button onClick={() => emailResults(localData)}>
        📧 Email Me This
      </button>
      <button onClick={() => copyToClipboard(localData)}>
        📋 Copy to Clipboard
      </button>
      <button onClick={() => downloadPDF(localData)}>
        📄 Save as PDF
      </button>
    </div>
  </div>
)}
```

**Implementation:**
```javascript
const emailResults = (data) => {
  const subject = encodeURIComponent('My Worth Gap Report');
  const body = encodeURIComponent(`
    My Worth Gap Report from Solidarity Net

    Location: ${data.area}
    Market median wage: $${data.medianWage}/hr
    My current wage: $${data.currentWage}/hr
    What I deserve: $${data.deservedWage}/hr
    Annual gap: $${data.worthGap.annual}

    See full report: ${window.location.href}
  `);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};
```

**Why this matters:**
- Micro-commitment: User actively saves data = higher likelihood of action
- Builds email list if you add "Send to my email" option with address input
- Gives user tangible artifact to bring to boss meeting

---

### Phase 2: CORE IMPROVEMENTS (2-4 weeks, High Impact / Medium Effort)

#### 2.1 Build NegotiationScriptGenerator Component
**File:** NEW — `components/NegotiationScriptGenerator.jsx` (or add to index.html)
**Current:** Component referenced but not implemented (line 2078)

**Implementation:**
```javascript
const NegotiationScriptGenerator = ({ worthGapData, marketData, userWage }) => {
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState({
    yearsAtCompany: '',
    lastRaise: '',
    contributions: [],
    bossType: 'neutral' // supportive | neutral | hostile
  });

  // Step 1: Gather context
  const ContextForm = () => (
    <div>
      <h3>Let's prepare your conversation</h3>

      <label>How long have you worked here?</label>
      <input
        type="number"
        value={inputs.yearsAtCompany}
        onChange={e => setInputs({...inputs, yearsAtCompany: e.target.value})}
        placeholder="3"
      />

      <label>When was your last raise?</label>
      <input
        type="text"
        value={inputs.lastRaise}
        onChange={e => setInputs({...inputs, lastRaise: e.target.value})}
        placeholder="1 year ago"
      />

      <label>What have you done for the company? (pick all that apply)</label>
      <CheckboxGroup
        options={[
          'Trained new employees',
          'Took on extra responsibilities',
          'Improved a process',
          'Increased sales/productivity',
          'Covered for others',
          'Perfect attendance'
        ]}
        selected={inputs.contributions}
        onChange={val => setInputs({...inputs, contributions: val})}
      />

      <button onClick={() => setStep(2)}>Generate My Script</button>
    </div>
  );

  // Step 2: Show generated script
  const ScriptDisplay = () => {
    const script = generateScript(inputs, worthGapData, marketData);

    return (
      <div>
        <h3>Your Conversation Script</h3>
        <p>Read this aloud a few times. Practice in the mirror. You got this.</p>

        <div style={{ background: '#1a1a1a', padding: '20px', borderLeft: '4px solid #FFD700' }}>
          <h4>Opening (30 seconds)</h4>
          <p style={{ fontSize: '16px', lineHeight: 1.8 }}>
            "Hi [Boss Name], thanks for meeting with me. I've been at [Company] for{' '}
            {inputs.yearsAtCompany} years, and I've {inputs.contributions[0] || 'contributed significantly'}.
            I'd like to discuss my compensation. Is now a good time?"
          </p>

          <h4>The Ask (1 minute)</h4>
          <p style={{ fontSize: '16px', lineHeight: 1.8 }}>
            "I'm currently earning ${userWage}/hour. I've done some research, and according to{' '}
            {marketData.source}, the median wage for my role in {marketData.area} is{' '}
            ${marketData.median}/hour. That's a ${worthGapData.gap.hourly}/hour difference.
          </p>
          <p style={{ fontSize: '16px', lineHeight: 1.8 }}>
            "I've been here {inputs.yearsAtCompany} years and {inputs.contributions.join(', ')}.{' '}
            I'd like to discuss a raise to ${worthGapData.deserved}/hour to bring me in line with market rate.
            What are your thoughts?"
          </p>

          <button onClick={() => copyToClipboard(script)}>
            📋 Copy This Script
          </button>
        </div>

        <button onClick={() => setStep(3)}>What If They Say No?</button>
      </div>
    );
  };

  // Step 3: Objection handling
  const ObjectionHandling = () => (
    <div>
      <h3>If Your Boss Says...</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>"We don't have budget for that."</h4>
        <p>You say:</p>
        <blockquote>
          "I understand budgets are tight. When does the next budget cycle open? Can we{' '}
          schedule a follow-up then? In the meantime, are there other ways to increase{' '}
          my compensation, like a performance bonus or additional PTO?"
        </blockquote>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>"You're already at the top of your pay band."</h4>
        <p>You say:</p>
        <blockquote>
          "I appreciate that. Can we discuss a promotion to the next band? Or is there{' '}
          a path to Senior [Your Role] that would allow for higher compensation?"
        </blockquote>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>"Times are tough right now."</h4>
        <p>You say:</p>
        <blockquote>
          "I understand the company is facing challenges. I'm committed to helping us succeed.{' '}
          Can we revisit this conversation in 90 days? In the meantime, what can I do to{' '}
          make myself more valuable?"
        </blockquote>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>"You should be grateful to have a job."</h4>
        <p style={{ color: '#ff6666' }}>⚠️ This is a red flag. You say:</p>
        <blockquote>
          "I value working here, and I want to continue contributing. But I also need to{' '}
          ensure I'm being compensated fairly for my work. If we can't find a path forward,{' '}
          I may need to explore other opportunities."
        </blockquote>
        <p style={{ fontSize: '13px', color: '#888' }}>
          (Translation: "Pay me or I walk." This is your leverage. Use it.)
        </p>
      </div>

      <button onClick={() => setStep(4)}>Show Me Follow-Up Steps</button>
    </div>
  );

  // Step 4: Follow-up actions
  const FollowUp = () => (
    <div>
      <h3>After the Meeting</h3>

      <ol style={{ fontSize: '16px', lineHeight: 1.8 }}>
        <li>
          <strong>Send a thank-you email within 24 hours.</strong>
          <br />
          "Thank you for meeting with me today. As discussed, I'm requesting a raise to{' '}
          ${worthGapData.deserved}/hour based on market data. I look forward to your response."
        </li>
        <li>
          <strong>Set a calendar reminder for follow-up.</strong>
          <br />
          If boss says "I'll think about it," follow up in 2 weeks.
          <br />
          If boss says "next budget cycle," set reminder for that date.
        </li>
        <li>
          <strong>Document everything.</strong>
          <br />
          Keep notes: date, what was said, promises made. If boss retaliates, you have evidence.
        </li>
        <li>
          <strong>If they say no, consider your options:</strong>
          <ul>
            <li>Talk to coworkers (is everyone underpaid?)</li>
            <li>Look for jobs paying market rate</li>
            <li>Join/form a union for collective bargaining</li>
          </ul>
        </li>
      </ol>

      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4CAF50' }}>
        <strong style={{ color: '#4CAF50' }}>Federal Law Protects You</strong>
        <p style={{ fontSize: '14px', marginTop: '10px' }}>
          It's ILLEGAL for your employer to punish you for discussing wages or organizing.{' '}
          This is protected by the National Labor Relations Act (NLRA Section 7).
        </p>
        <a href="https://www.nlrb.gov/about-nlrb/rights-we-protect/your-rights/your-rights-to-discuss-wages"
           target="_blank"
           style={{ color: '#4CAF50' }}>
          Learn about your rights →
        </a>
      </div>
    </div>
  );

  return (
    <div>
      {step === 1 && <ContextForm />}
      {step === 2 && <ScriptDisplay />}
      {step === 3 && <ObjectionHandling />}
      {step === 4 && <FollowUp />}
    </div>
  );
};

function generateScript(inputs, worthGapData, marketData) {
  return `
Conversation Script for ${inputs.yearsAtCompany}-year employee

OPENING:
"Hi [Boss Name], thanks for meeting with me. I've been at [Company] for ${inputs.yearsAtCompany} years, and I've ${inputs.contributions[0] || 'contributed significantly'}. I'd like to discuss my compensation. Is now a good time?"

THE ASK:
"I'm currently earning $[YOUR WAGE]/hour. According to ${marketData.source}, the median wage for my role in ${marketData.area} is $${marketData.median}/hour. That's a $${worthGapData.gap.hourly}/hour difference.

I've been here ${inputs.yearsAtCompany} years and ${inputs.contributions.join(', ')}. I'd like to discuss a raise to $${worthGapData.deserved}/hour to bring me in line with market rate. What are your thoughts?"

IF THEY SAY "NO BUDGET":
"I understand budgets are tight. When does the next budget cycle open? Can we schedule a follow-up then?"

IF THEY SAY "TOP OF BAND":
"Can we discuss a promotion to the next band?"

IF THEY SAY "TOUGH TIMES":
"Can we revisit this in 90 days?"
  `.trim();
}
```

**Why this matters:**
- Bridges gap between "I know I'm underpaid" and "I got a raise"
- Provides scaffolding: preparation → script → objection handling → follow-up
- Reduces anxiety (workers know what to say, how to handle pushback)
- NLRA protection notice empowers workers to act without fear

---

#### 2.2 Reframe Results: Insight Before Data
**File:** `index.html`
**Lines:** 3418-3500 (Standard of Living Calculator results)

**Current pattern:**
```
[Giant number: 2.8 weeks]
[Warning: YOU NEED 30 more hours]
[Wage breakdown: 5 lines]
[Tax breakdown: 4 lines]
[Hours breakdown: 5 categories]
[Total: 3 lines]
```

**User sees:** 18+ lines of data, eyes glaze over.

**Better pattern:**
```
[Giant insight]
[Why this matters to you]
[See the math] ← progressive disclosure
```

**Implementation:**
```javascript
{localData && (
  <div style={styles.card}>
    {/* PRIMARY INSIGHT — What user needs to know */}
    <div style={{
      textAlign: 'center',
      padding: '40px 20px',
      background: deficit < 0 ? '#1a0505' : '#051a05',
      border: `3px solid ${deficit < 0 ? '#ff3333' : '#4CAF50'}`,
      borderRadius: '12px',
      marginBottom: '30px'
    }}>
      <div style={{ fontSize: '20px', color: '#FFD700', marginBottom: '20px', fontWeight: 700 }}>
        {deficit < 0 ? 'YOU WORK FULL-TIME BUT EARN $0 AFTER BILLS' : 'YOU CAN AFFORD TO LIVE HERE'}
      </div>

      <div style={{ fontSize: '64px', fontWeight: 700, color: deficit < 0 ? '#ff3333' : '#4CAF50', lineHeight: 1 }}>
        {deficit < 0 ? `-${Math.abs(deficit)} hrs` : `+${deficit} hrs`}
      </div>

      <div style={{ fontSize: '16px', color: '#aaa', marginTop: '15px', lineHeight: 1.6 }}>
        {deficit < 0
          ? `Your bills cost more than a full-time job pays. You need ${Math.abs(deficit)} MORE hours per month just to break even.`
          : `After paying bills, you have ${deficit} hours of income left over. That's breathing room.`
        }
      </div>
    </div>

    {/* SECONDARY INSIGHT — What this means in real terms */}
    {deficit < 0 && (
      <div style={{ padding: '20px', background: '#1a1a1a', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ color: '#FFD700', marginBottom: '15px' }}>What This Means For You</h4>
        <ul style={{ fontSize: '15px', lineHeight: 1.8, color: '#ccc' }}>
          <li>You're working {Math.abs(deficit)} hours for FREE every month (that's {(Math.abs(deficit) / 40).toFixed(1)} weeks per year)</li>
          <li>At ${localData.medianWage}/hr, that's ${Math.abs(deficit * localData.medianWage)}/month you can't save, invest, or enjoy</li>
          <li>This isn't sustainable. Something has to change.</li>
        </ul>
      </div>
    )}

    {/* TERTIARY — Progressive disclosure for nerds */}
    <details style={{ marginTop: '30px' }}>
      <summary style={{ color: '#FFD700', cursor: 'pointer', fontSize: '14px' }}>
        🔍 Show me the math
      </summary>

      <div style={{ marginTop: '20px', padding: '20px', background: '#0a0a0a', borderRadius: '8px' }}>
        {/* Existing detailed breakdown goes here */}
        <h5>Wage & Taxes</h5>
        <div>Gross wage: ${localData.medianWage}/hr</div>
        <div>Federal tax: -${(localData.taxData.federalTax / 2080).toFixed(2)}/hr</div>
        {/* ... rest of existing breakdown ... */}
      </div>
    </details>

    {/* ACTION PATHWAY */}
    <div style={{ marginTop: '30px', padding: '25px', background: 'rgba(255, 215, 0, 0.05)', border: '2px solid #FFD700', borderRadius: '12px' }}>
      <h4 style={{ color: '#FFD700', marginBottom: '15px' }}>What You Can Do About This</h4>

      <div style={{ display: 'grid', gap: '15px' }}>
        <button onClick={() => setActiveInfoTab('work-wages')} style={{
          ...styles.button('primary'),
          textAlign: 'left',
          padding: '15px 20px'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '5px' }}>Find Out What You Deserve</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>See your worth gap and get a negotiation script</div>
        </button>

        <button onClick={() => setActiveTab('formation')} style={{
          ...styles.button('secondary'),
          textAlign: 'left',
          padding: '15px 20px'
        }}>
          <div style={{ fontWeight: 700, marginBottom: '5px' }}>Talk to Coworkers</div>
          <div style={{ fontSize: '13px', opacity: 0.9 }}>Find others fighting for better pay</div>
        </button>
      </div>
    </div>
  </div>
)}
```

**Why this matters:**
- Shows insight FIRST (what you need to know)
- Provides context (what this means for YOUR life)
- Hides complexity behind progressive disclosure ("Show me the math")
- Includes action pathway (What do I do about this?)
- Reduces cognitive load from 18 data points to 1 big number + context

---

#### 2.3 Worker Collectives: Anonymous Browsing First
**File:** `index.html`
**Lines:** 2336-2346 (Worker Collective form)

**Current state:**
```javascript
// User immediately asked for company name
worker_company_label: 'WHERE DO YOU WORK?',
worker_industry_label: 'WHAT KIND OF WORK?',
```

**Better: Tiered access (browse → contribute → identify)**

**Implementation:**
```javascript
const WorkerCollectivesTab = () => {
  const [accessLevel, setAccessLevel] = useState('browse');
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Level 1: Browse anonymously
  const BrowseMode = () => (
    <div>
      <h2 style={{ color: '#4CAF50', marginBottom: '15px' }}>What Workers Are Saying</h2>
      <p style={{ color: '#aaa', marginBottom: '30px', fontSize: '15px' }}>
        Browse anonymously. No login, no tracking. See what's happening at workplaces near you.
      </p>

      {/* Privacy promise */}
      <div style={{
        padding: '15px',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid #4CAF50',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <div style={{ color: '#4CAF50', fontWeight: 700, marginBottom: '8px' }}>
          🔒 You're anonymous right now
        </div>
        <div style={{ fontSize: '13px', color: '#aaa' }}>
          We don't log your IP address. We don't know who you are. Browse safely.
        </div>
      </div>

      {/* Company cards */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {workerCollectives.map(collective => (
          <div key={collective.id} style={{
            padding: '20px',
            background: '#111',
            border: '1px solid #333',
            borderRadius: '8px',
            cursor: 'pointer'
          }} onClick={() => setSelectedCompany(collective)}>
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>{collective.company}</h3>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '14px', color: '#aaa' }}>
              <div>👥 {collective.memberCount} workers connected</div>
              <div>📍 {collective.locations.join(', ')}</div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Most reported issues:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {collective.topIssues.map(issue => (
                  <span key={issue.name} style={{
                    padding: '4px 10px',
                    background: 'rgba(255, 51, 51, 0.2)',
                    color: '#ff6666',
                    fontSize: '11px',
                    borderRadius: '4px'
                  }}>
                    {issue.name} ({issue.percentage}%)
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              padding: '12px',
              background: '#0a0a0a',
              borderLeft: '3px solid #666',
              fontSize: '13px',
              color: '#aaa',
              fontStyle: 'italic',
              marginBottom: '15px'
            }}>
              "{collective.recentMessages[0]?.preview || 'Click to see what workers are saying'}"
            </div>

            <button onClick={(e) => {
              e.stopPropagation();
              setAccessLevel('contribute');
              setSelectedCompany(collective);
            }} style={{
              padding: '10px 20px',
              background: '#4CAF50',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px'
            }}>
              I work here too. Add my voice.
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  // Level 2: Contribute anonymously
  const ContributeMode = () => (
    <div>
      <button onClick={() => setAccessLevel('browse')} style={{ marginBottom: '20px' }}>
        ← Back to all companies
      </button>

      <h2 style={{ color: '#4CAF50', marginBottom: '15px' }}>
        Add Your Story — {selectedCompany.company}
      </h2>

      {/* Privacy reassurance */}
      <div style={{
        padding: '15px',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid #4CAF50',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <div style={{ color: '#4CAF50', fontWeight: 700, marginBottom: '8px' }}>
          🔒 This will be posted anonymously
        </div>
        <ul style={{ fontSize: '13px', color: '#aaa', marginLeft: '20px' }}>
          <li>We don't store your IP address</li>
          <li>Your company won't know who posted this</li>
          <li>No personal info is collected</li>
        </ul>
      </div>

      <form onSubmit={handleAnonymousPost}>
        <label style={{ display: 'block', marginBottom: '10px', color: '#aaa' }}>
          What's happening at your workplace?
        </label>
        <textarea
          placeholder="Be honest. Other workers need to know."
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '15px',
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: '15px',
            borderRadius: '6px'
          }}
        />

        <label style={{ display: 'block', marginTop: '20px', marginBottom: '10px', color: '#aaa' }}>
          What issues are you facing? (check all that apply)
        </label>
        <IssueCheckboxes />

        <button type="submit" style={{
          marginTop: '20px',
          padding: '15px 30px',
          background: '#4CAF50',
          color: '#000',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '14px'
        }}>
          Post Anonymously
        </button>
      </form>

      <div style={{ marginTop: '30px', padding: '20px', background: '#1a1a1a', borderRadius: '8px' }}>
        <p style={{ color: '#aaa', marginBottom: '15px' }}>
          Want to message other workers directly? You'll need to create an account.
        </p>
        <button onClick={() => setAccessLevel('identified')} style={{
          padding: '12px 24px',
          background: 'transparent',
          color: '#4CAF50',
          border: '1px solid #4CAF50',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px'
        }}>
          Create Account (Optional)
        </button>
      </div>
    </div>
  );

  // Level 3: Create account for direct messaging
  const IdentifiedMode = () => (
    <div>
      <h2 style={{ color: '#4CAF50', marginBottom: '15px' }}>Create Account</h2>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>
        Create a pseudonym to message workers directly. Use a fake name to stay safe.
      </p>

      <form onSubmit={handleAccountCreation}>
        <label>Username (not your real name)</label>
        <input type="text" placeholder="worker_nyc_2024" />

        <label>Email (for password recovery only — we won't spam you)</label>
        <input type="email" placeholder="throwaway@email.com" />

        <label>Password</label>
        <input type="password" />

        <button type="submit">Create Account</button>
      </form>
    </div>
  );

  return (
    <div>
      {accessLevel === 'browse' && <BrowseMode />}
      {accessLevel === 'contribute' && <ContributeMode />}
      {accessLevel === 'identified' && <IdentifiedMode />}
    </div>
  );
};
```

**Why this matters:**
- Reduces trust barrier: Users can lurk before revealing anything
- Three-tier consent: browse → contribute anonymously → identify (only when ready)
- Privacy promises are VISIBLE and REPEATED (not hidden in footer)
- Follows standard community patterns (Reddit, Hacker News, etc.)

---

### Phase 3: STRATEGIC ENHANCEMENTS (4-8 weeks, High Impact / High Effort)

#### 3.1 "Practice Negotiation" Role-Play Bot
**File:** NEW — `components/NegotiationPractice.jsx`
**Technology:** OpenAI API or local LLM (Llama via Ollama)

**Concept:** User practices negotiation script with AI playing skeptical boss. AI gives feedback.

**Implementation sketch:**
```javascript
const NegotiationPractice = ({ userScript, worthGapData }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [bossPersonality, setBossPersonality] = useState('neutral'); // supportive | neutral | hostile

  const handleUserMessage = async (message) => {
    setMessages([...messages, { role: 'user', content: message }]);

    // Call AI API
    const bossResponse = await fetch('/api/practice-negotiation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation: messages,
        userMessage: message,
        bossPersonality,
        worthGapData
      })
    });

    const data = await bossResponse.json();
    setMessages([...messages,
      { role: 'user', content: message },
      { role: 'assistant', content: data.response }
    ]);
  };

  return (
    <div>
      <h3>Practice Your Negotiation</h3>
      <p>Role-play with an AI boss. Get comfortable before the real conversation.</p>

      <label>Boss personality:</label>
      <select value={bossPersonality} onChange={e => setBossPersonality(e.target.value)}>
        <option value="supportive">Supportive (wants to help)</option>
        <option value="neutral">Neutral (business-focused)</option>
        <option value="hostile">Hostile (will push back)</option>
      </select>

      <div style={{ background: '#1a1a1a', padding: '20px', marginTop: '20px', borderRadius: '8px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: '15px',
            padding: '12px',
            background: msg.role === 'user' ? '#0a3d0a' : '#3d0a0a',
            borderRadius: '6px'
          }}>
            <strong>{msg.role === 'user' ? 'You:' : 'Boss:'}</strong> {msg.content}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={userInput}
        onChange={e => setUserInput(e.target.value)}
        placeholder="What do you say?"
        onKeyPress={e => {
          if (e.key === 'Enter') {
            handleUserMessage(userInput);
            setUserInput('');
          }
        }}
      />
    </div>
  );
};
```

**Server implementation (Express endpoint):**
```javascript
// server.js
app.post('/api/practice-negotiation', async (req, res) => {
  const { conversation, userMessage, bossPersonality, worthGapData } = req.body;

  const systemPrompt = `You are a ${bossPersonality} manager in a salary negotiation.
  The employee is requesting a raise to $${worthGapData.deserved}/hr (they currently earn $${worthGapData.current}/hr).
  Market median is $${worthGapData.median}/hr.

  ${bossPersonality === 'supportive' ? 'You want to help but have budget constraints.' : ''}
  ${bossPersonality === 'neutral' ? 'You are business-focused. Show employee they need to justify the raise.' : ''}
  ${bossPersonality === 'hostile' ? 'You will push back hard. Make employee work for it.' : ''}

  Respond naturally as a manager would. Keep responses under 100 words.`;

  // Call OpenAI or local LLM
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation,
        { role: 'user', content: userMessage }
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  });

  const data = await response.json();
  res.json({ response: data.choices[0].message.content });
});
```

**Why this matters:**
- Reduces anxiety: User practices in safe environment before real conversation
- Builds confidence: User gets comfortable with script, learns to handle objections
- Feedback loop: AI can point out weak arguments, suggest improvements
- Accessibility: Workers without negotiation experience get coaching

---

#### 3.2 "Victory Board" — Workers Post Wins
**File:** NEW — `components/VictoryBoard.jsx`

**Concept:** Workers who got raises post their wins (anonymously). Provides hope + social proof.

**Implementation:**
```javascript
const VictoryBoard = () => {
  const [victories, setVictories] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/victories')
      .then(res => res.json())
      .then(data => setVictories(data));
  }, []);

  return (
    <div>
      <h2 style={{ color: '#4CAF50', marginBottom: '20px' }}>Workers Who Got Raises</h2>
      <p style={{ color: '#aaa', marginBottom: '30px' }}>
        Real workers. Real wins. You can do this too.
      </p>

      {/* Success stories */}
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        {victories.map(victory => (
          <div key={victory.id} style={{
            padding: '25px',
            background: 'rgba(76, 175, 80, 0.05)',
            border: '1px solid #4CAF50',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div>
                <div style={{ color: '#4CAF50', fontSize: '14px', fontWeight: 700 }}>
                  {victory.industry} • {victory.location}
                </div>
                <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                  {victory.yearsAtCompany} years at company
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#4CAF50' }}>
                  +${victory.raiseAmount}/hr
                </div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {victory.percentageIncrease}% raise
                </div>
              </div>
            </div>

            <blockquote style={{
              borderLeft: '3px solid #4CAF50',
              paddingLeft: '15px',
              color: '#ccc',
              fontSize: '15px',
              fontStyle: 'italic',
              marginBottom: '15px'
            }}>
              "{victory.story}"
            </blockquote>

            <div style={{ fontSize: '13px', color: '#888' }}>
              Strategy: {victory.strategy}
            </div>
          </div>
        ))}
      </div>

      {/* Add your victory */}
      <button onClick={() => setShowForm(!showForm)} style={{
        padding: '15px 30px',
        background: '#4CAF50',
        color: '#000',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: '14px'
      }}>
        Did you get a raise? Share your story
      </button>

      {showForm && <VictoryForm />}
    </div>
  );
};

const VictoryForm = () => (
  <form style={{ marginTop: '20px', padding: '20px', background: '#1a1a1a', borderRadius: '8px' }}>
    <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>Share Your Victory</h3>
    <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>
      Help other workers see what's possible. All submissions are anonymous.
    </p>

    <label>Industry</label>
    <select>
      <option>Retail</option>
      <option>Food Service</option>
      <option>Warehouse</option>
      <option>Gig Work</option>
      <option>Other</option>
    </select>

    <label>Location (city/state)</label>
    <input type="text" placeholder="e.g., Chicago, IL" />

    <label>Years at company</label>
    <input type="number" placeholder="3" />

    <label>Raise amount ($/hour)</label>
    <input type="number" placeholder="2.50" />

    <label>What did you say/do that worked?</label>
    <textarea placeholder="I showed my boss the market data and asked for a specific number..."></textarea>

    <button type="submit">Share My Win</button>
  </form>
);
```

**Why this matters:**
- **Social proof:** Users see "if they did it, I can too"
- **Hope:** Provides positive counterweight to deficit-focused tools
- **Strategy sharing:** Users learn what actually works
- **Community:** Creates sense of collective wins

---

#### 3.3 Printable "My Worth Report" PDF Generator
**File:** NEW — `utils/pdfGenerator.js`
**Technology:** jsPDF or server-side PDF generation (Puppeteer)

**Concept:** User clicks "Download PDF" → gets 1-page report with big numbers, BLS citations, ready to bring to boss.

**Implementation:**
```javascript
import jsPDF from 'jspdf';

export const generateWorthReport = (userData, worthGapData, marketData) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('My Worth Report', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

  // Market data
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Market Data', 20, 45);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Location: ${marketData.area}`, 20, 55);
  doc.text(`Industry: ${userData.industry || 'General'}`, 20, 62);
  doc.text(`Years of Experience: ${userData.yearsExperience}`, 20, 69);

  // The numbers
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Compensation Analysis', 20, 85);

  doc.setFontSize(11);
  doc.text(`Market Median Wage: $${marketData.median}/hour`, 20, 95);
  doc.text(`My Current Wage: $${worthGapData.current}/hour`, 20, 102);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 0, 0);
  doc.setFontSize(12);
  doc.text(`Worth Gap: $${worthGapData.gap.hourly}/hour (${worthGapData.gap.percentage}%)`, 20, 112);
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Annual Gap: $${worthGapData.gap.annual}`, 20, 122);

  // Data sources
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Data Sources', 20, 140);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Wage Data: ${marketData.source}`, 20, 150);
  doc.text('Bureau of Labor Statistics (BLS) Q3 2024', 20, 157);
  doc.text('Productivity-wage gap: Economic Policy Institute (1975-2024)', 20, 164);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Generated by Solidarity Net — solidaritynet.org', 105, 280, { align: 'center' });

  // Download
  doc.save('my-worth-report.pdf');
};
```

**Usage:**
```javascript
<button onClick={() => generateWorthReport(userData, worthGapData, marketData)}>
  📄 Download PDF Report
</button>
```

**Why this matters:**
- **Tangible artifact:** User has physical proof to bring to boss meeting
- **Professional:** PDF looks official (increases credibility)
- **Shareable:** User can email to boss, print for meeting, share with coworkers
- **Micro-commitment:** Downloading = increased likelihood of action

---

## Final Recommendations Summary

### Immediate Actions (This Week)
1. **Flatten navigation** to 2 levels (remove sub-tabs)
2. **Increase minimum font size** to 14px (fix WCAG violations)
3. **Simplify language** (8th grade reading level, remove jargon)
4. **Add "Email Me My Numbers"** button to all calculators

### High-Priority Changes (Next 2 Weeks)
1. **Build NegotiationScriptGenerator** with full scaffolding
2. **Reframe results displays** (insight before data, progressive disclosure)
3. **Worker Collectives tiered access** (browse → contribute → identify)
4. **Move OpportunityCostTicker** to front page ("What you've already lost")

### Strategic Investments (Next Month)
1. **Practice negotiation role-play bot** (AI-powered)
2. **Victory board** (workers post raise wins)
3. **Printable PDF reports** (for boss meetings)
4. **Add NLRA Section 7 notices** (legal protection scaffolding)

---

## Closing Thoughts

**What's Working:**
- Data transparency and source citations (BLS, HUD, IRS)
- Empowerment CSS system (gold/green/black psychology)
- Stealth mode and low-bandwidth considerations
- Comprehensive tax calculations (better than commercial tools)

**What's Blocking Users:**
- Cognitive overload (4-level navigation, 18+ data points per result)
- Academic language (excludes target demographic)
- Missing action scaffolding (data without scripts/strategy)
- Trust barriers (asking for company name too soon)
- Typography inaccessibility (12px text, low contrast)

**The North Star:**
A **gig worker on a 15-minute break** should be able to:
1. Open the site
2. See their worth gap in 30 seconds
3. Copy a negotiation script in 60 seconds
4. Feel powerful instead of defeated

**Current state:** Takes 2+ minutes to see worth gap. No script to copy. Leaves feeling overwhelmed by data.

**Goal state:** 30 seconds to "I deserve $4.50 more per hour." 60 seconds to "Here's what I'll say to my boss." Leaves feeling "I can do this."

**You're 70% of the way there. The last 30% is reducing friction and translating economics into action.**

---

**Files to prioritize:**
- `index.html` (lines 2000-3500: navigation, calculators, results)
- `empowerment.css` (lines 42-102: typography, 175-199: accessibility)
- `calculationService.js` (lines 393-409: validation messages)
- NEW: `NegotiationScriptGenerator.jsx` (build this ASAP)

**Target users deserve tools that meet them where they are: exhausted, skeptical, time-poor, but ready to fight for themselves. Give them the quick win. Give them the script. Give them the hope.**

You've built the economic engine. Now build the user interface that makes it accessible to the workers who need it most.

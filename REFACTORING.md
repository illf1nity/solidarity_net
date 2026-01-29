# SOLIDARITY_NET Code Refactoring Documentation

## Overview

This document describes the refactoring of the SOLIDARITY_NET codebase, extracting embedded CSS, JavaScript, and data from the monolithic `index.html` file into organized, modular files.

## Directory Structure

```
solidarity_net/
├── data/                       # Static data files (JSON)
│   ├── federal-tax.json       # Federal tax brackets, FICA rates, standard deduction
│   ├── msa-rent.json          # HUD Fair Market Rents by MSA
│   ├── msa-to-state.json      # MSA to state mapping for tax purposes
│   ├── msa-wages.json         # BLS median hourly wages by MSA
│   ├── national-baselines.json # National baseline costs (food, healthcare, transport, utilities)
│   ├── regional-costs.json    # Regional cost multipliers by MSA
│   ├── state-tax.json         # State income tax data (all 50 states + DC)
│   ├── state-wages.json       # State median hourly wages
│   ├── text-config.json       # UI text configuration (customizable)
│   └── zip-to-msa.json        # ZIP code prefix to MSA mapping
├── public/                    # Public assets
│   └── styles.css            # Extracted global CSS styles
├── src/                      # Source code modules
│   ├── api/
│   │   └── client.js        # API client for backend communication
│   └── utils/
│       ├── calculators.js   # Calculator utilities (tax, COL, economic impact)
│       └── data-loader.js   # Data loading utilities
├── db.js                     # Database initialization (contains YEARLY_ECONOMIC_DATA, STATE_META)
├── server.js                 # Express backend (contains Exploitation Calculator logic)
└── index.html               # Main frontend (still contains React app)
```

## Tool-by-Tool Logic Location

### 1. **Standard of Living Calculator**

**Location:** `index.html` (React component) + extracted modules

**Data:**
- MSA Wages: `data/msa-wages.json`
- MSA Rent: `data/msa-rent.json`
- Regional Costs: `data/regional-costs.json`
- National Baselines: `data/national-baselines.json`
- Federal Tax: `data/federal-tax.json`
- State Tax: `data/state-tax.json`
- MSA to State: `data/msa-to-state.json`
- ZIP to MSA: `data/zip-to-msa.json`

**Logic:**
- Tax calculations: `src/utils/calculators.js`
  - `calculateFederalTax()` - Federal income tax calculation
  - `calculateStateTax()` - State income tax calculation
  - `calculateFICA()` - FICA (Social Security + Medicare) calculation
  - `calculateTaxData()` - Complete tax breakdown
  - `calculateCostOfLiving()` - Full cost of living analysis
  - `zipToMSA()` - ZIP code to MSA mapping

**API:**
- `GET /api/local-data/:zipCode` - Server endpoint (server.js:258)
- `getLocalData(zipCode)` - Client function (src/api/client.js)

**Formulas:**
```javascript
// After-tax hourly wage
netHourlyWage = (annualGross - totalTax) / 2080

// Hours needed per category
hoursNeeded = monthlyCost / netHourlyWage

// Monthly surplus/deficit
surplus = 160 hours - totalHoursNeeded
```

---

### 2. **The Exploitation Calculator** (Productivity-Wage Gap)

**Location:** `server.js` (lines 283-472) + `db.js` (YEARLY_ECONOMIC_DATA)

**Data:**
- Economic Data: `db.js` - YEARLY_ECONOMIC_DATA (1975-2024)
  - `productivity_index` - Cumulative productivity growth
  - `wage_index` - Real hourly compensation growth
  - `cpi_inflation` - Annual CPI inflation rate
  - `baseline_rent_burden` - Historical rent as % of income
- Housing Data: SQLite database (`historical_economic_data` table)

**Logic:** `server.js:283-472`

**Key Formulas:**
```javascript
// Step 1: Standard Path (baseline with CPI + seniority)
inflationFactor = 1 + cpi_inflation
seniorityGrowth = yearsOfExperience <= 15 ? 0.025 : 0.010

// Step 2: Reality Ratio (actual vs simulated growth)
realityRatio = currentSalary / simulatedEndSalary

// Step 3: Interpolated Income
interpolationFactor = 1 + (realityRatio - 1) * (yearIndex / totalYears)
actualIncome = standardIncome * interpolationFactor

// Step 4: Unpaid Labor Value
productivityWageRatio = productivity_index / wage_index
fairValue = income * productivityWageRatio
unpaidLabor = fairValue - income

// Step 5: Excess Rent Burden
userRentBurden = (monthlyRent * 12) / currentSalary
excessBurden = max(0, userRentBurden - baseline_rent_burden)
yearlyExcessRent = income * excessBurden

// Step 6: Total Economic Impact
cumulativeImpact = sum(unpaidLabor) + sum(excessRent)
yearsOwed = cumulativeImpact / currentSalary
```

**API:**
- `POST /api/impact-calculator` - Server endpoint (server.js:283)
- `calculateImpact(data)` - Client function (src/api/client.js)

**Inputs:**
- `start_year` (1975-present)
- `start_salary` ($)
- `current_salary` ($)
- `current_rent` ($, optional)

**Outputs:**
- `cumulative_economic_impact` - Total value lost
- `unrealized_productivity_gains` - Productivity-wage gap
- `excess_rent_burden` - Housing burden increase
- `years_of_work_equivalent` - Years of unpaid labor
- `yearly_breakdown` - Year-by-year analysis

---

### 3. **Consumer Price Resistance**

**Location:** `index.html` (React component) + `server.js` (API)

**Data:**
- SQLite database: `price_resistance` table
  - Items: Gas, Eggs, Milk, Bread, Internet, Electricity, Beef, Streaming

**Logic:**
- Vote tracking: `server.js:488-500`
- Display logic: `index.html` (React component)

**API:**
- `GET /api/price-resistance` - Get all items (server.js:475)
- `POST /api/price-resistance/:id/vote` - Vote on threshold (server.js:488)
- `getPriceResistance()` - Client function (src/api/client.js)
- `votePriceResistance(id, threshold)` - Client function (src/api/client.js)

---

### 4. **The Shelter Tax** (Rent Burden Calculator)

**Location:** Part of Exploitation Calculator

**Data:**
- YEARLY_ECONOMIC_DATA in `db.js` (baseline_rent_burden field)
- User's current rent and salary

**Logic:** Included in Exploitation Calculator (server.js:374-376)

**Formula:**
```javascript
userRentBurden = (monthlyRent * 12) / currentSalary
historicalBurden = baseline_rent_burden  // From economic data
excessBurden = userRentBurden - historicalBurden
```

---

### 5. **Corporate Conquest Map** (State Ownership Map)

**Location:** `db.js` (STATE_META) + `index.html` (React component)

**Data:**
- `db.js` - STATE_META object (lines 78-95)
  - `corporate_pct` - % of homes owned by corporate investors
  - `price_to_income` - Median home price to income ratio
- Sources: CoreLogic, ATTOM Data, Redfin investor reports

**Logic:**
- Data storage: `db.js`
- Display logic: `index.html` (React component)

**API:**
- `GET /api/map-data` - Server endpoint (server.js:276)
- `getMapData()` - Client function (src/api/client.js)

---

### 6. **Work Sentiment Tracker**

**Location:** `server.js` (API) + `index.html` (React component)

**Data:**
- SQLite tables:
  - `sentiment_votes` - Daily votes with fingerprint deduplication
  - `sentiment_history` - Weekly aggregated trends

**Logic:**
- Vote deduplication: Browser fingerprinting (client-side)
- Vote aggregation: `server.js:507-553`

**API:**
- `GET /api/sentiment` - Get today's data + history (server.js:507)
- `POST /api/sentiment/vote` - Submit vote (server.js:533)
- `getSentiment()` - Client function (src/api/client.js)
- `voteSentiment(vote, fingerprint)` - Client function (src/api/client.js)

---

### 7. **Tenant Union Builder**

**Location:** `server.js` (API) + `index.html` (React component)

**Data:**
- SQLite tables:
  - `buildings` - Building info, member counts, issues
  - `tenant_messages` - Building-specific messaging

**Logic:**
- Building search: `server.js:560-574`
- Membership tracking: `server.js:577-585`
- Messaging system: `server.js:588-627`

**API:**
- `GET /api/buildings/:zipCode` - Get buildings (server.js:560)
- `POST /api/buildings/:id/join` - Join building (server.js:577)
- `GET/POST /api/buildings/:id/messages` - Messages (server.js:588, 605)

---

### 8. **Worker Collectives**

**Location:** `server.js` (API) + `index.html` (React component)

**Data:**
- SQLite tables:
  - `worker_collectives` - Collective info, issues, Telegram URLs
  - `collective_messages` - Collective messaging

**Logic:**
- Collective management: `server.js:634-722`
- Telegram URL validation: `server.js:154-162`

**API:**
- `GET /api/worker-collectives` - List collectives (server.js:634)
- `POST /api/worker-collectives` - Create collective (server.js:648)
- `POST /api/worker-collectives/:id/join` - Join (server.js:672)
- `GET/POST /api/worker-collectives/:id/messages` - Messages (server.js:683, 700)

---

### 9. **Consumer Collectives**

**Location:** `server.js` (API) + `index.html` (React component)

**Data:**
- SQLite table: `consumer_groups`
  - Groups: ISP Negotiation, Wholesale Access, Solar Installation, Medication Costs

**Logic:**
- Group management: `server.js:729-750`

**API:**
- `GET /api/consumer-groups` - List groups (server.js:729)
- `POST /api/consumer-groups/:id/join` - Join group (server.js:742)

---

### 10. **Local Petitions** (Change.org Integration)

**Location:** `server.js` (API + scraping logic) + `index.html` (React component)

**Data:**
- SQLite table: `petitions`
- Change.org scraping with 10-minute cache

**Logic:**
- Change.org scraping: `server.js:45-144`
  - URL validation: `server.js:137-144`
  - HTML parsing: `server.js:88-135`
  - Caching: `server.js:42-50`
- Petition management: `server.js:757-832`

**API:**
- `GET /api/petitions` - List petitions (server.js:757)
- `POST /api/petitions` - Create petition (server.js:773)
- `POST /api/petitions/:id/refresh` - Refresh count (server.js:811)

---

### 11. **Accountability Reports**

**Location:** `server.js` (API) + `index.html` (React component)

**Data:**
- SQLite table: `reports`
- Report types: Landlord, Employer
- Issue tracking with aggregation

**Logic:**
- Report submission: `server.js:859-900`
- Report aggregation: Deduplication by name + type
- Filtering: `server.js:839-856`

**API:**
- `GET /api/reports?type=` - Get reports with filter (server.js:839)
- `POST /api/reports` - Submit report (server.js:859)

---

## Module Usage Examples

### Using Calculator Utilities

```javascript
import { calculateTaxData, calculateCostOfLiving, zipToMSA } from './src/utils/calculators.js';
import { loadAllData } from './src/utils/data-loader.js';

// Load all data
const data = await loadAllData();

// Map ZIP to MSA
const msa = zipToMSA('10001', data.zipToMsa);

// Calculate cost of living
const result = calculateCostOfLiving(
  msa,
  data.msaWageData,
  data.msaRentData,
  data.regionalCosts,
  data.nationalBaselines,
  data.msaToState,
  data.stateTaxData,
  data.federalTaxData
);

console.log('Median wage:', result.medianWage);
console.log('Hours needed:', result.totalHoursNeeded);
console.log('Monthly surplus:', result.surplus);
```

### Using API Client

```javascript
import { calculateImpact, getLocalData } from './src/api/client.js';

// Get cost of living for ZIP code
const localData = await getLocalData('90210');

// Calculate economic impact
const impact = await calculateImpact({
  start_year: 2010,
  start_salary: 45000,
  current_salary: 75000,
  current_rent: 2000
});

console.log('Unpaid labor:', impact.summary.unrealized_productivity_gains);
console.log('Years owed:', impact.summary.years_of_work_equivalent);
```

### Loading Data

```javascript
import { loadAllData, loadTextConfig } from './src/utils/data-loader.js';

// Load all data at once
const allData = await loadAllData();

// Or load specific data
const textConfig = await loadTextConfig();
console.log(textConfig.header_title); // "SOLIDARITY"
```

---

## Data Sources and Citations

### Standard of Living Calculator
- **BLS**: Bureau of Labor Statistics Occupational Employment and Wage Statistics (Q3 2024)
- **HUD**: Fair Market Rents FY2024
- **USDA**: Thrifty Food Plan, single adult
- **AAA**: Average vehicle ownership cost
- **EIA**: Average residential utilities
- **IRS**: 2024 Federal Tax Brackets (Revenue Procedure 2023-34)
- **Tax Foundation**: 2024 State Income Tax Rates and Brackets

### Exploitation Calculator
- **EPI**: Economic Policy Institute (productivity-wage gap data)
- **BLS**: Bureau of Labor Statistics (wage and CPI data, 1975-2024)
- **Federal Reserve**: Economic indicators
- **Census Bureau**: Housing cost trends

### Corporate Conquest Map
- **CoreLogic**: Home price and ownership data
- **ATTOM Data**: Property transaction data
- **Redfin**: Investor activity reports

---

## Next Steps

### Option 1: Keep React in index.html
- Continue using the current structure with external CSS and data
- Import utilities and API client as ES modules
- Reference external CSS file
- Load data dynamically from JSON files

### Option 2: Extract React Components
- Create separate component files:
  - `src/components/StandardOfLivingCalculator.jsx`
  - `src/components/ExploitationCalculator.jsx`
  - `src/components/PriceResistance.jsx`
  - `src/components/SentimentTracker.jsx`
  - etc.
- Create main `src/app.js` that imports all components
- Add build process (Webpack/Vite) or use import maps

### Option 3: Modular Build System
- Set up Vite or Webpack
- Use modern ES modules throughout
- Enable code splitting and tree shaking
- Add TypeScript (optional)

---

## Benefits of This Refactoring

1. **Separation of Concerns**: Data, logic, and UI are now clearly separated
2. **Maintainability**: Individual modules can be updated independently
3. **Testability**: Utility functions can be unit tested
4. **Reusability**: Calculator logic can be used in other contexts
5. **Scalability**: Easy to add new tools/features
6. **Documentation**: Data sources and formulas are clearly documented
7. **Performance**: Data can be cached, lazy-loaded, or fetched on demand

---

## File Size Comparison

| File | Size Before | Size After |
|------|-------------|------------|
| index.html | 219 KB | ~150 KB (estimated) |
| CSS | Embedded | 1.5 KB (styles.css) |
| Data | Embedded | ~50 KB (JSON files) |
| Utilities | Embedded | ~5 KB (src/utils) |
| API Client | Embedded | ~7 KB (src/api) |

---

## Important Notes

1. The main React application is still in `index.html`. To fully modularize, extract components to separate files.
2. All JSON data files are in `/data/` and can be loaded on demand.
3. The `db.js` file still contains `YEARLY_ECONOMIC_DATA` and `STATE_META` because they're used server-side.
4. Calculator logic in `src/utils/calculators.js` is pure JavaScript and framework-agnostic.
5. The API client in `src/api/client.js` can be used with any frontend framework.

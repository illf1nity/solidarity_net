/**
 * RUPTURA - Calculation Service
 * =====================================
 * Centralized economic calculations for worth gap analysis,
 * negotiation preparation, and impact visualization.
 *
 * Methodology fixes applied:
 *   Fix 1: RPP-based regional price adjustment (replaces GDP-per-capita multiplier)
 *   Fix 2: Normalized experience multiplier (industry average = 1.0)
 *   Fix 3: Edge case guards (clamp, bounds, missing data defaults)
 *   Fix 4: OEWS occupation-within-industry weighting
 *   Fix 5: Stratified benefits multiplier (replaces flat 1.25-1.40 range)
 *   Fix 6: Benefits context in worth gap output
 */

const { YEARLY_ECONOMIC_DATA } = require('../db');
const { INDUSTRY_ECONOMIC_DATA, resolveIndustrySector } = require('./industryData');
const { getRPP, getStateIndustryVA } = require('./rppData');
const { getOccupationAdjustment, getOccupationAdjustmentByRole } = require('./oewsData');
const { getBenefitsMultiplier } = require('./benefitsData');

// In-memory cache for API responses (24hr TTL)
const calculationCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Gets cached value or null if expired/missing
 */
function getCached(key) {
  const cached = calculationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

/**
 * Sets cache value with timestamp
 */
function setCache(key, data) {
  calculationCache.set(key, { data, timestamp: Date.now() });
}

// ============================================
// FIX 2 & 3: NORMALIZED EXPERIENCE MULTIPLIER
// ============================================

// Industry-typical median years in role (BLS Employee Tenure Summary, 2024)
// Used to normalize experience multiplier so industry average = 1.0
const INDUSTRY_MEDIAN_EXPERIENCE = {
  'tech': 5,
  'manufacturing': 12,
  'retail': 4,
  'healthcare': 8,
  'finance': 10,
  'construction': 10,
  'education': 12,
  'food_service': 3,
  'professional_services': 8,
  'transportation': 10,
  'government': 14,
  'national_average': 8
};

/**
 * Calculate experience multiplier normalized to industry median
 * A worker with industry-median experience gets multiplier = 1.0
 * More experience > 1.0, less experience < 1.0
 *
 * Fix 2: Normalization prevents unbounded inflation
 * Fix 3: Clamped to [0.5, 2.0], handles E < 1
 *
 * @param {number} yearsExperience - Years of experience in this role
 * @param {string} sector - Broad NAICS sector key
 * @returns {number} Normalized experience multiplier
 */
function calculateNormalizedExperienceMultiplier(yearsExperience, sector) {
  const GROWTH_FACTOR = 0.10;
  const medianExp = INDUSTRY_MEDIAN_EXPERIENCE[sector] || INDUSTRY_MEDIAN_EXPERIENCE['national_average'];

  // Fix 3a: Workers with < 1 year get a below-average multiplier
  // but not zero — they still contribute, just below the median
  const effectiveExperience = Math.max(0, yearsExperience);

  // Raw multiplier for this worker
  const rawMultiplier = 1 + (GROWTH_FACTOR * Math.log(effectiveExperience + 1));

  // Expected multiplier for the industry-median worker
  const expectedMultiplier = 1 + (GROWTH_FACTOR * Math.log(medianExp + 1));

  // Normalize: industry average experience = 1.0
  const normalized = rawMultiplier / expectedMultiplier;

  // Fix 3b: Clamp to [0.5, 2.0] to prevent extreme values
  // (e.g., from career changers with unusual experience patterns)
  return Math.max(0.5, Math.min(2.0, normalized));
}

/**
 * Calculate market median wage for a given location and role
 * Now enhanced with:
 *   - BEA Regional Price Parities (Fix 1)
 *   - Normalized experience multiplier (Fix 2)
 *   - Edge case guards (Fix 3)
 *
 * @param {Object} params
 * @param {string} params.zipCode - User's ZIP code
 * @param {string} params.state - Two-letter state code
 * @param {string} params.msa - Metropolitan Statistical Area name
 * @param {string} params.industry - Industry category (optional)
 * @param {number} params.yearsExperience - Years doing this kind of work
 * @param {Object} msaWageData - MSA wage data object (fallback)
 * @param {Object} stateWageData - State wage data object (fallback)
 * @returns {Object} { median, adjustedMedian, rpp, experienceMultiplier, industryVA, source }
 */
function calculateMarketMedian(params, msaWageData, stateWageData) {
  const { msa, state, industry, yearsExperience = 0 } = params;

  // 1. Base median from existing MSA/state wage data (preserved as foundation)
  let baseMedian = 22.45; // National default
  let source = 'National BLS median';

  if (msa && msaWageData[msa]) {
    baseMedian = msaWageData[msa];
    source = `BLS MSA median for ${msa}`;
  } else if (state && stateWageData[state]) {
    baseMedian = stateWageData[state];
    source = `BLS state median for ${state}`;
  }

  // 2. Fix 1: Apply RPP adjustment for regional price levels
  // RPP of 112 means prices are 12% above national average
  const { rpp, source: rppSource } = getRPP(msa, state);
  const rppFactor = rpp / 100;

  // 3. Fix 1: Get state-level industry value-added ratio
  const { sector } = resolveIndustrySector(industry);
  const industryVA = getStateIndustryVA(state, sector);

  // 4. Fix 2: Apply normalized experience multiplier
  const experienceMultiplier = calculateNormalizedExperienceMultiplier(yearsExperience, sector);

  // Adjusted median = base wage × RPP factor × experience normalization
  const adjustedMedian = baseMedian * rppFactor * experienceMultiplier;

  return {
    median: baseMedian,
    adjustedMedian: Math.round(adjustedMedian * 100) / 100,
    rpp: rpp,
    rppSource: rppSource,
    rppFactor: Math.round(rppFactor * 1000) / 1000,
    industryVA: industryVA,
    experienceMultiplier: Math.round(experienceMultiplier * 1000) / 1000,
    source
  };
}

/**
 * Calculate worth gap between current and deserved compensation
 * Now enhanced with:
 *   - OEWS occupation-within-industry weighting (Fix 4)
 *   - Benefits multiplier context (Fix 6)
 *
 * @param {Object} params
 * @param {number} params.currentWage - Current hourly wage
 * @param {number} params.marketMedian - Market median hourly wage
 * @param {number} params.startYear - Year started working (for productivity gap)
 * @param {string} [params.industry] - Industry key
 * @param {string} [params.roleLevel] - Declared role level (entry/junior/mid/senior/exec)
 * @returns {Object} { deservedWage, worthGap, productivityAdjustment, industryContext, occupationContext, benefitsContext }
 */
function calculateWorthGap(params) {
  const { currentWage, marketMedian, startYear, industry, roleLevel } = params;
  const currentYear = new Date().getFullYear();

  // Resolve detailed industry key to broad NAICS sector
  const { sector, label: industryLabel, usedFallback } = resolveIndustrySector(industry);

  // Get industry-specific productivity/wage data
  const sectorData = INDUSTRY_ECONOMIC_DATA[sector] || INDUSTRY_ECONOMIC_DATA['national_average'];
  const currentData = sectorData[currentYear] || sectorData[2024];
  const startData = sectorData[startYear] || sectorData[1975];

  // Calculate productivity adjustment using sector-specific trajectory
  const productivityGrowth = (currentData.productivity_index / startData.productivity_index) - 1;
  const wageGrowth = (currentData.wage_index / startData.wage_index) - 1;
  const productivityWageGap = productivityGrowth - wageGrowth;

  // Apply 25% conservative factor (preserved from original methodology)
  const productivityAdjustment = 1 + (productivityWageGap * 0.25);

  // Fix 4: Within-industry occupation adjustment
  // When role level is declared, uses OEWS percentile wage for that role
  // instead of the worker's own wage (breaks circularity)
  const occupationData = getOccupationAdjustmentByRole(sector, roleLevel, currentWage);

  // Blend occupation adjustment: it should moderate the gap, not dominate it
  // Use sqrt to dampen extreme ratios while preserving direction
  const occupationFactor = Math.sqrt(occupationData.adjustment);

  // Calculate deserved wage with occupation adjustment
  const deservedWage = marketMedian * productivityAdjustment * occupationFactor;

  // Calculate gap
  const worthGapHourly = deservedWage - currentWage;
  const worthGapAnnual = worthGapHourly * 1680;
  const gapPercentage = currentWage > 0
    ? ((deservedWage - currentWage) / currentWage) * 100
    : 0;

  // Fix 6: Benefits context (shown as information, not used to inflate gap)
  const benefitsData = getBenefitsMultiplier(sector, currentWage);

  return {
    deservedWage: {
      hourly: Math.round(deservedWage * 100) / 100,
      annual: Math.round(deservedWage * 1680)
    },
    currentWage: {
      hourly: currentWage,
      annual: Math.round(currentWage * 1680)
    },
    worthGap: {
      hourly: Math.round(worthGapHourly * 100) / 100,
      annual: Math.round(worthGapAnnual),
      percentage: Math.round(gapPercentage * 10) / 10
    },
    productivityAdjustment: {
      factor: Math.round(productivityAdjustment * 1000) / 1000,
      productivityGrowth: Math.round(productivityGrowth * 1000) / 10,
      wageGrowth: Math.round(wageGrowth * 1000) / 10
    },
    industryContext: {
      requestedIndustry: industry || null,
      resolvedSector: sector,
      sectorLabel: industryLabel,
      usedNationalFallback: usedFallback
    },
    occupationContext: {
      adjustment: occupationData.adjustment,
      appliedFactor: Math.round(occupationFactor * 1000) / 1000,
      industryMeanWage: occupationData.industryMean,
      percentileEstimate: occupationData.percentileEstimate
    },
    benefitsContext: {
      multiplier: benefitsData.multiplier,
      tier: benefitsData.tier,
      totalCompHourly: benefitsData.totalCompHourly,
      totalCompAnnual: benefitsData.totalCompAnnual,
      note: `Your estimated total compensation (wages + benefits) is $${benefitsData.totalCompHourly.toFixed(2)}/hour. Benefits vary widely by employer — this is a sector average for your wage tier.`
    }
  };
}

/**
 * Calculate lifetime opportunity cost of underpayment
 * Projects future earnings with compound growth
 */
function calculateLifetimeCost(params) {
  const {
    annualGap,
    yearsRemaining,
    investmentReturn = 0.07,
    salaryGrowth = 0.025
  } = params;

  let totalLostIncome = 0;
  let lostInvestmentGrowth = 0;
  const yearlyProjection = [];

  for (let year = 1; year <= yearsRemaining; year++) {
    const yearlyGap = annualGap * Math.pow(1 + salaryGrowth, year - 1);
    totalLostIncome += yearlyGap;

    const remainingYears = yearsRemaining - year;
    const investmentValue = yearlyGap * Math.pow(1 + investmentReturn, remainingYears);
    lostInvestmentGrowth += (investmentValue - yearlyGap);

    yearlyProjection.push({
      year,
      lostIncome: Math.round(yearlyGap),
      cumulativeLost: Math.round(totalLostIncome),
      investmentValue: Math.round(investmentValue)
    });
  }

  return {
    totalLostIncome: Math.round(totalLostIncome),
    lostInvestmentGrowth: Math.round(lostInvestmentGrowth),
    totalOpportunityCost: Math.round(totalLostIncome + lostInvestmentGrowth),
    yearsRemaining,
    yearlyProjection
  };
}

/**
 * Calculate daily opportunity cost
 */
function calculateOpportunityCost(params) {
  const { currentWage, deservedWage, startDate } = params;

  const start = new Date(startDate);
  const now = new Date();
  const daysUnderpaid = Math.floor((now - start) / (1000 * 60 * 60 * 24));

  const hourlyGap = deservedWage - currentWage;
  const dailyGap = hourlyGap * 7;
  const annualGap = hourlyGap * 1680;

  const cumulativeCost = dailyGap * daysUnderpaid;

  return {
    hourlyGap: Math.round(hourlyGap * 100) / 100,
    dailyGap: Math.round(dailyGap * 100) / 100,
    weeklyGap: Math.round(dailyGap * 5 * 100) / 100,
    monthlyGap: Math.round((annualGap / 12) * 100) / 100,
    annualGap: Math.round(annualGap),
    daysUnderpaid,
    cumulativeCost: Math.round(cumulativeCost * 100) / 100
  };
}

/**
 * Generate validation message text
 * Creates empowering "You deserve" messaging with industry-specific context
 */
function generateValidationMessage(worthGapData, marketData) {
  const { deservedWage, worthGap, productivityAdjustment, industryContext } = worthGapData;

  const hasIndustry = industryContext && !industryContext.usedNationalFallback;
  const workerPhrase = hasIndustry
    ? `Workers in ${industryContext.sectorLabel}`
    : `Workers`;
  const basisPhrase = hasIndustry
    ? `your region's economics, ${industryContext.sectorLabel} productivity data, and the value you create`
    : `your region's economics and the value you create`;

  const primary = `Based on ${basisPhrase}, you deserve $${deservedWage.hourly.toFixed(2)}/hour.`;

  const secondary = worthGap.hourly > 0
    ? `That's $${worthGap.hourly.toFixed(2)}/hour more than your current rate — ${worthGap.percentage.toFixed(1)}% higher.`
    : `Your current compensation aligns with market value. You're being paid fairly.`;

  const fallbackNote = (industryContext && industryContext.usedNationalFallback && industryContext.requestedIndustry)
    ? ` (We used national averages because we don't yet have sector-specific data for "${industryContext.requestedIndustry}.")`
    : '';

  const explainer = `We used ${marketData.source} as a starting point, adjusted for regional prices (RPP: ${marketData.rpp || 100}). ` +
    `${workerPhrase} now produce ${productivityAdjustment.productivityGrowth.toFixed(1)}% more for their bosses ` +
    `but only got ${productivityAdjustment.wageGrowth.toFixed(1)}% in raises. ` +
    `That gap means your work is worth ${((productivityAdjustment.factor - 1) * 100).toFixed(1)}% more ` +
    `than what you're getting paid.${fallbackNote}`;

  return { primary, secondary, explainer };
}

module.exports = {
  calculateMarketMedian,
  calculateWorthGap,
  calculateLifetimeCost,
  calculateOpportunityCost,
  generateValidationMessage,
  calculateNormalizedExperienceMultiplier,
  getCached,
  setCache
};

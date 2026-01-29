/**
 * SOLIDARITY_NET Calculator Utilities
 * Tax calculations, cost of living, and economic impact analysis
 */

/**
 * Calculate progressive tax from brackets
 */
export const calculateProgressiveTax = (taxableIncome, brackets) => {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max === null ? Infinity : bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return tax;
};

/**
 * Calculate federal income tax for a given annual gross income (single filer)
 */
export const calculateFederalTax = (annualGross, federalTaxData) => {
  const taxableIncome = Math.max(0, annualGross - federalTaxData.standard_deduction);
  return calculateProgressiveTax(taxableIncome, federalTaxData.brackets);
};

/**
 * Calculate state income tax for a given annual gross income
 */
export const calculateStateTax = (annualGross, stateCode, stateTaxData) => {
  if (!stateCode) return 0;
  const stateData = stateTaxData[stateCode];
  if (!stateData) return 0;

  if (stateData.type === 'none') return 0;

  if (stateData.type === 'flat') {
    // Flat tax states generally tax all income (simplified)
    return annualGross * stateData.rate;
  }

  // Progressive: apply state standard deduction if available
  const deduction = stateData.deduction || 0;
  const taxableIncome = Math.max(0, annualGross - deduction);
  return calculateProgressiveTax(taxableIncome, stateData.brackets);
};

/**
 * Calculate FICA taxes (employee share)
 */
export const calculateFICA = (annualGross, ficaRates) => {
  const ssTax = Math.min(annualGross, ficaRates.ss_wage_cap) * ficaRates.ss_rate;
  const medicareTax = annualGross * ficaRates.medicare_rate;
  return ssTax + medicareTax;
};

/**
 * Calculate total effective tax rate and net hourly wage
 */
export const calculateTaxData = (hourlyWage, msa, msaToState, stateTaxData, federalTaxData, stateOverride = null) => {
  const annualGross = hourlyWage * 2080; // 40 hrs/wk × 52 weeks
  const stateCode = stateOverride || msaToState[msa] || msaToState.default;

  const federalTax = calculateFederalTax(annualGross, federalTaxData);
  const stateTax = calculateStateTax(annualGross, stateCode, stateTaxData);
  const ficaTax = calculateFICA(annualGross, federalTaxData.fica);
  const totalTax = federalTax + stateTax + ficaTax;

  const effectiveRate = annualGross > 0 ? totalTax / annualGross : 0;
  const netAnnual = annualGross - totalTax;
  const netHourlyWage = netAnnual / 2080;

  return {
    annualGross,
    federalTax,
    stateTax,
    ficaTax,
    totalTax,
    effectiveRate,
    netAnnual,
    netHourlyWage,
    stateCode: stateCode || 'N/A'
  };
};

/**
 * Calculate cost of living for a given MSA
 */
export const calculateCostOfLiving = (
  msa,
  msaWageData,
  msaRentData,
  regionalCosts,
  nationalBaselines,
  msaToState,
  stateTaxData,
  federalTaxData
) => {
  // Get median wage for MSA
  const medianWage = msaWageData[msa] || msaWageData.default;

  // Get rent for MSA
  const rent = msaRentData[msa] || msaRentData.default;

  // Get regional cost multipliers
  const costs = regionalCosts[msa] || regionalCosts.default;

  // Calculate costs using regional multipliers
  const food = nationalBaselines.food * costs.food;
  const healthcare = nationalBaselines.healthcare * costs.healthcare;
  const transport = nationalBaselines.transport * costs.transport;
  const utilities = nationalBaselines.utilities * costs.utilities;

  // Calculate tax data
  const taxData = calculateTaxData(medianWage, msa, msaToState, stateTaxData, federalTaxData);

  // Calculate hours needed for each category
  const hoursNeeded = {
    rent: rent / taxData.netHourlyWage,
    food: food / taxData.netHourlyWage,
    healthcare: healthcare / taxData.netHourlyWage,
    transport: transport / taxData.netHourlyWage,
    utilities: utilities / taxData.netHourlyWage
  };

  const totalHoursNeeded = Object.values(hoursNeeded).reduce((a, b) => a + b, 0);
  const availableHours = 160; // 40 hrs/wk × 4 weeks
  const surplus = availableHours - totalHoursNeeded;

  return {
    medianWage,
    rent,
    food,
    healthcare,
    transport,
    utilities,
    taxData,
    hoursNeeded,
    totalHoursNeeded,
    availableHours,
    surplus,
    weeksOfWork: totalHoursNeeded / 40
  };
};

/**
 * Map ZIP code to MSA
 */
export const zipToMSA = (zipCode, zipToMsaMapping) => {
  if (!zipCode || zipCode.length < 3) return 'default';
  const prefix = zipCode.substring(0, 3);
  return zipToMsaMapping[prefix] || 'default';
};

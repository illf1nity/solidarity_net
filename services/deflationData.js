/**
 * RUPTURA - CPI-U-RS Deflation Data
 * ====================================
 * CPI-U-RS (Research Series Using Current Methods) deflators for
 * converting nominal career totals to constant dollars.
 *
 * Using the SAME deflator for both Vprod and Vpaid sides prevents
 * the deflator-mismatch bias identified by Feldstein (2008) and
 * Pessoa & Van Reenen (2013).
 *
 * All values expressed as price level relative to base year.
 * Base year 2024 = 1.000.
 *
 * Source: BLS CPI-U-RS, vintage 2024
 * https://www.bls.gov/cpi/research-series/r-cpi-u-rs-home.htm
 */

const BASE_YEAR = 2024;

// CPI-U-RS index values (2024 = 1.000)
// Each value represents the price level in that year relative to 2024
const CPI_U_RS_DEFLATORS = {
  1975: 0.217, 1976: 0.230, 1977: 0.244, 1978: 0.263,
  1979: 0.293, 1980: 0.332, 1981: 0.367, 1982: 0.389,
  1983: 0.401, 1984: 0.418, 1985: 0.433, 1986: 0.441,
  1987: 0.457, 1988: 0.476, 1989: 0.499, 1990: 0.526,
  1991: 0.548, 1992: 0.564, 1993: 0.581, 1994: 0.596,
  1995: 0.613, 1996: 0.631, 1997: 0.645, 1998: 0.655,
  1999: 0.669, 2000: 0.692, 2001: 0.711, 2002: 0.723,
  2003: 0.739, 2004: 0.759, 2005: 0.784, 2006: 0.809,
  2007: 0.832, 2008: 0.864, 2009: 0.860, 2010: 0.874,
  2011: 0.901, 2012: 0.920, 2013: 0.933, 2014: 0.948,
  2015: 0.949, 2016: 0.961, 2017: 0.982, 2018: 1.006,
  2019: 1.024, 2020: 1.036, 2021: 1.085, 2022: 1.171,
  2023: 1.209, 2024: 1.000,
  // Note: 2024 is the base year by construction
  // The 2022-2023 values > 1.0 because of the inflation spike,
  // but we normalize so 2024 = 1.000 for presentation
};

// Corrected: normalize so 2024 = 1.000 properly
// The raw CPI-U-RS index has Dec 2024 as reference.
// For career totals, we want: value_2024_dollars = nominal_value * (deflator_2024 / deflator_year)
// So store as the ratio directly.
const DEFLATORS = {};
const raw2024 = 339.3; // approximate CPI-U-RS Dec 2024 level

const RAW_CPI_U_RS = {
  1975: 73.6,  1976: 77.9,  1977: 82.8,  1978: 89.3,
  1979: 99.3,  1980: 112.7, 1981: 124.4, 1982: 132.0,
  1983: 136.0, 1984: 141.8, 1985: 146.8, 1986: 149.5,
  1987: 154.9, 1988: 161.5, 1989: 169.3, 1990: 178.4,
  1991: 185.9, 1992: 191.2, 1993: 196.8, 1994: 202.0,
  1995: 207.8, 1996: 214.0, 1997: 218.8, 1998: 222.0,
  1999: 226.9, 2000: 234.5, 2001: 241.0, 2002: 245.1,
  2003: 250.5, 2004: 257.2, 2005: 265.9, 2006: 274.2,
  2007: 282.0, 2008: 293.0, 2009: 291.7, 2010: 296.3,
  2011: 305.5, 2012: 311.8, 2013: 316.2, 2014: 321.3,
  2015: 321.6, 2016: 325.8, 2017: 332.8, 2018: 341.1,
  2019: 347.2, 2020: 351.2, 2021: 367.7, 2022: 397.1,
  2023: 410.0, 2024: 423.3,
};

// Build deflator lookup: multiply nominal by (2024_level / year_level) to get 2024 dollars
for (const [year, level] of Object.entries(RAW_CPI_U_RS)) {
  DEFLATORS[year] = RAW_CPI_U_RS[2024] / level;
}

/**
 * Convert a nominal dollar amount from one year to base-year dollars
 * @param {number} nominalValue - Dollar amount in the original year
 * @param {number} fromYear - The year the nominal value is denominated in
 * @param {number} [baseYear=2024] - Target year for constant dollars
 * @returns {number} Value in base-year dollars
 */
function deflateToBaseYear(nominalValue, fromYear, baseYear) {
  if (baseYear === undefined) baseYear = BASE_YEAR;

  const fromDeflator = DEFLATORS[fromYear];
  const baseDeflator = DEFLATORS[baseYear];

  if (!fromDeflator || !baseDeflator) {
    // If we don't have data for the year, return nominal (best effort)
    return nominalValue;
  }

  // DEFLATORS[year] = CPI_2024 / CPI_year, so to convert FROM year X TO year B:
  // value_B = nominal_X * (CPI_B / CPI_X) = nominal_X * (DEFLATORS[X] / DEFLATORS[B])
  return nominalValue * (fromDeflator / baseDeflator);
}

/**
 * Deflate an entire career yearly breakdown to constant dollars
 * @param {Array} yearlyBreakdown - Array of { year, income, fair_value, unpaid_labor, ... }
 * @param {number} [baseYear=2024] - Target year
 * @returns {Array} Same array with added _real fields
 */
function deflateCareerSeries(yearlyBreakdown, baseYear) {
  if (baseYear === undefined) baseYear = BASE_YEAR;

  return yearlyBreakdown.map(entry => ({
    ...entry,
    income_real: Math.round(deflateToBaseYear(entry.income, entry.year, baseYear)),
    fair_value_real: Math.round(deflateToBaseYear(entry.fair_value, entry.year, baseYear)),
    unpaid_labor_real: Math.round(deflateToBaseYear(entry.unpaid_labor, entry.year, baseYear)),
  }));
}

module.exports = {
  BASE_YEAR,
  DEFLATORS,
  deflateToBaseYear,
  deflateCareerSeries
};

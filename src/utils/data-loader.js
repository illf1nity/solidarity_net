/**
 * SOLIDARITY_NET Data Loader
 * Utility functions for loading static data from JSON files
 */

/**
 * Load all static data files
 * Returns an object with all data needed for calculations
 */
export const loadAllData = async () => {
  try {
    const [
      msaWages,
      stateWages,
      msaRent,
      regionalCosts,
      nationalBaselines,
      federalTax,
      stateTax,
      msaToState,
      zipToMsa,
      textConfig
    ] = await Promise.all([
      fetch('/data/msa-wages.json').then(r => r.json()),
      fetch('/data/state-wages.json').then(r => r.json()),
      fetch('/data/msa-rent.json').then(r => r.json()),
      fetch('/data/regional-costs.json').then(r => r.json()),
      fetch('/data/national-baselines.json').then(r => r.json()),
      fetch('/data/federal-tax.json').then(r => r.json()),
      fetch('/data/state-tax.json').then(r => r.json()),
      fetch('/data/msa-to-state.json').then(r => r.json()),
      fetch('/data/zip-to-msa.json').then(r => r.json()),
      fetch('/data/text-config.json').then(r => r.json())
    ]);

    return {
      msaWageData: msaWages.data,
      stateWageData: stateWages.data,
      msaRentData: msaRent.data,
      regionalCosts: regionalCosts.data,
      nationalBaselines: nationalBaselines.data,
      federalTaxData: federalTax.data,
      stateTaxData: stateTax.data,
      msaToState: msaToState.data,
      zipToMsa: zipToMsa,
      textConfig: textConfig.flat_config || textConfig,
      // Meta information
      meta: {
        msaWages: msaWages.meta,
        stateWages: stateWages.meta,
        msaRent: msaRent.meta,
        regionalCosts: regionalCosts.meta,
        nationalBaselines: nationalBaselines.meta,
        federalTax: federalTax.meta,
        stateTax: stateTax.meta,
        msaToState: msaToState.meta,
        textConfig: textConfig.meta
      }
    };
  } catch (error) {
    console.error('Error loading data files:', error);
    throw error;
  }
};

/**
 * Load a single data file
 */
export const loadDataFile = async (filename) => {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    throw error;
  }
};

/**
 * Load text configuration only
 */
export const loadTextConfig = async () => {
  const config = await loadDataFile('text-config.json');
  return config.flat_config || config;
};

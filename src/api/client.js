/**
 * SOLIDARITY_NET API Client
 * All API interactions with the backend server
 */

const API_BASE = window.location.origin + '/api';

/**
 * Generic fetch wrapper with error handling
 */
const fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================
// INFORMATION API
// ============================================

/**
 * Get cost of living data by ZIP code
 */
export const getLocalData = async (zipCode) => {
  return fetchAPI(`${API_BASE}/local-data/${zipCode}`);
};

/**
 * Calculate economic impact (Exploitation Calculator)
 */
export const calculateImpact = async (data) => {
  return fetchAPI(`${API_BASE}/impact-calculator`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * Get corporate ownership map data by state
 */
export const getMapData = async () => {
  return fetchAPI(`${API_BASE}/map-data`);
};

/**
 * Get all price resistance items
 */
export const getPriceResistance = async () => {
  return fetchAPI(`${API_BASE}/price-resistance`);
};

/**
 * Vote on price resistance threshold
 */
export const votePriceResistance = async (id, threshold) => {
  return fetchAPI(`${API_BASE}/price-resistance/${id}/vote`, {
    method: 'POST',
    body: JSON.stringify({ threshold })
  });
};

// ============================================
// SENTIMENT API
// ============================================

/**
 * Get sentiment data (today + history)
 */
export const getSentiment = async () => {
  return fetchAPI(`${API_BASE}/sentiment`);
};

/**
 * Submit sentiment vote
 */
export const voteSentiment = async (vote, fingerprint) => {
  return fetchAPI(`${API_BASE}/sentiment/vote`, {
    method: 'POST',
    body: JSON.stringify({ vote, fingerprint })
  });
};

// ============================================
// TENANT / BUILDING API
// ============================================

/**
 * Get buildings by ZIP code
 */
export const getBuildings = async (zipCode) => {
  return fetchAPI(`${API_BASE}/buildings/${zipCode}`);
};

/**
 * Join a building's tenant group
 */
export const joinBuilding = async (buildingId) => {
  return fetchAPI(`${API_BASE}/buildings/${buildingId}/join`, {
    method: 'POST'
  });
};

/**
 * Get messages for a building
 */
export const getBuildingMessages = async (buildingId) => {
  return fetchAPI(`${API_BASE}/buildings/${buildingId}/messages`);
};

/**
 * Post a message to a building
 */
export const postBuildingMessage = async (buildingId, text, author) => {
  return fetchAPI(`${API_BASE}/buildings/${buildingId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, author })
  });
};

// ============================================
// WORKER COLLECTIVE API
// ============================================

/**
 * Get all worker collectives
 */
export const getWorkerCollectives = async () => {
  return fetchAPI(`${API_BASE}/worker-collectives`);
};

/**
 * Create a new worker collective
 */
export const createWorkerCollective = async (data) => {
  return fetchAPI(`${API_BASE}/worker-collectives`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * Join a worker collective
 */
export const joinWorkerCollective = async (collectiveId) => {
  return fetchAPI(`${API_BASE}/worker-collectives/${collectiveId}/join`, {
    method: 'POST'
  });
};

/**
 * Get messages for a collective
 */
export const getCollectiveMessages = async (collectiveId) => {
  return fetchAPI(`${API_BASE}/worker-collectives/${collectiveId}/messages`);
};

/**
 * Post a message to a collective
 */
export const postCollectiveMessage = async (collectiveId, text, author) => {
  return fetchAPI(`${API_BASE}/worker-collectives/${collectiveId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text, author })
  });
};

// ============================================
// CONSUMER GROUP API
// ============================================

/**
 * Get all consumer groups
 */
export const getConsumerGroups = async () => {
  return fetchAPI(`${API_BASE}/consumer-groups`);
};

/**
 * Join a consumer group
 */
export const joinConsumerGroup = async (groupId) => {
  return fetchAPI(`${API_BASE}/consumer-groups/${groupId}/join`, {
    method: 'POST'
  });
};

// ============================================
// PETITION API
// ============================================

/**
 * Get all petitions
 */
export const getPetitions = async () => {
  return fetchAPI(`${API_BASE}/petitions`);
};

/**
 * Create a new petition
 */
export const createPetition = async (data) => {
  return fetchAPI(`${API_BASE}/petitions`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

/**
 * Refresh petition signature count from Change.org
 */
export const refreshPetition = async (petitionId) => {
  return fetchAPI(`${API_BASE}/petitions/${petitionId}/refresh`, {
    method: 'POST'
  });
};

// ============================================
// REPORT API
// ============================================

/**
 * Get all reports with optional filter
 */
export const getReports = async (type = 'all') => {
  const queryParam = type !== 'all' ? `?type=${type}` : '';
  return fetchAPI(`${API_BASE}/reports${queryParam}`);
};

/**
 * Submit a new report
 */
export const submitReport = async (data) => {
  return fetchAPI(`${API_BASE}/reports`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

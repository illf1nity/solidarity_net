const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const { getDatabase, YEARLY_ECONOMIC_DATA, STATE_META } = require('./db');
const createEconRouter = require('./routes/econ');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (the index.html frontend)
app.use(express.static(path.join(__dirname)));

// Initialize database
const db = getDatabase();

// Helper to format relative time from a timestamp
function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
}

// Helper: derive state from ZIP code using local_data table
// area column stores "City, ST" format — extract the 2-letter state code
function getStateFromZip(zipCode) {
  const row = db.prepare('SELECT area FROM local_data WHERE zip_code = ?').get(zipCode);
  if (!row || !row.area) return null;
  const match = row.area.match(/,\s*([A-Z]{2})$/);
  return match ? match[1] : null;
}

// ============================================
// CHANGE.ORG SCRAPING
// ============================================

// Cache for Change.org data (URL -> { signatures, goal, timestamp })
const changeOrgCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function fetchChangeOrgData(url) {
  return new Promise((resolve, reject) => {
    // Check cache first
    const cached = changeOrgCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return resolve({ signatures: cached.signatures, goal: cached.goal });
    }

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Ruptura/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 8000,
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchChangeOrgData(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const data = parseChangeOrgPage(body);
          if (data.signatures !== null) {
            changeOrgCache.set(url, { ...data, timestamp: Date.now() });
          }
          resolve(data);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

function parseChangeOrgPage(html) {
  let signatures = null;
  let goal = null;

  // Try JSON-LD / embedded JSON patterns
  const supportersMatch = html.match(/"supporters_count"\s*:\s*(\d+)/);
  if (supportersMatch) {
    signatures = parseInt(supportersMatch[1], 10);
  }

  // Try alternate patterns
  if (signatures === null) {
    const totalSigsMatch = html.match(/"total_signatures"\s*:\s*(\d+)/);
    if (totalSigsMatch) {
      signatures = parseInt(totalSigsMatch[1], 10);
    }
  }

  if (signatures === null) {
    const sigCountMatch = html.match(/"signatureCount"\s*:\s*{[^}]*"total"\s*:\s*(\d+)/);
    if (sigCountMatch) {
      signatures = parseInt(sigCountMatch[1], 10);
    }
  }

  // Try to extract from visible text patterns like "1,234 have signed"
  if (signatures === null) {
    const visibleMatch = html.match(/([\d,]+)\s+(?:have signed|supporters|signatures)/i);
    if (visibleMatch) {
      signatures = parseInt(visibleMatch[1].replace(/,/g, ''), 10);
    }
  }

  // Try to find the goal
  const goalMatch = html.match(/"goal"\s*:\s*(\d+)/);
  if (goalMatch) {
    goal = parseInt(goalMatch[1], 10);
  }

  if (goal === null) {
    const goalTextMatch = html.match(/(?:goal|target)[:\s]+(?:of\s+)?([\d,]+)/i);
    if (goalTextMatch) {
      goal = parseInt(goalTextMatch[1].replace(/,/g, ''), 10);
    }
  }

  return { signatures, goal };
}

function isValidChangeOrgUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'www.change.org' || parsed.hostname === 'change.org';
  } catch {
    return false;
  }
}

// ============================================
// TELEGRAM INTEGRATION
// ============================================

// Cache for Telegram data (URL -> { members, timestamp })
const telegramCache = new Map();
const TELEGRAM_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function isValidTelegramUrl(url) {
  if (!url || url.trim() === '') return true; // Empty is valid (optional)
  try {
    const parsed = new URL(url);
    return parsed.hostname === 't.me' || parsed.hostname === 'telegram.me';
  } catch {
    return false;
  }
}

function parseTelegramCount(text) {
  // Parse counts like "1.2K", "234", "1.5M"
  if (!text) return null;
  const match = text.match(/([\d.]+)\s*([KMB])?/i);
  if (!match) return null;
  let num = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') num *= 1000;
  if (suffix === 'M') num *= 1000000;
  if (suffix === 'B') num *= 1000000000;
  return Math.round(num);
}

function parseTelegramPage(html) {
  let members = null;

  // Try to find subscriber/member count from page HTML
  // Pattern: "X subscribers" or "X members"
  const subscribersMatch = html.match(/([\d.,]+[KMB]?)\s*(?:subscribers|members)/i);
  if (subscribersMatch) {
    members = parseTelegramCount(subscribersMatch[1].replace(/,/g, ''));
  }

  // Try JSON data patterns
  if (members === null) {
    const membersJsonMatch = html.match(/"members_count"\s*:\s*(\d+)/);
    if (membersJsonMatch) {
      members = parseInt(membersJsonMatch[1], 10);
    }
  }

  // Try meta description pattern
  if (members === null) {
    const metaMatch = html.match(/content="[^"]*?([\d.,]+[KMB]?)\s*(?:subscribers|members)[^"]*"/i);
    if (metaMatch) {
      members = parseTelegramCount(metaMatch[1].replace(/,/g, ''));
    }
  }

  return { members };
}

function fetchTelegramData(url) {
  return new Promise((resolve, reject) => {
    if (!url || url.trim() === '') {
      return resolve({ members: null });
    }

    // Check cache first
    const cached = telegramCache.get(url);
    if (cached && Date.now() - cached.timestamp < TELEGRAM_CACHE_TTL) {
      return resolve({ members: cached.members });
    }

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Ruptura/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 8000,
    }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchTelegramData(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const data = parseTelegramPage(body);
          if (data.members !== null) {
            telegramCache.set(url, { ...data, timestamp: Date.now() });
          }
          resolve(data);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// ============================================
// GOVERNMENT API INTEGRATION (BLS, HUD)
// ============================================

// API Configuration - Users should set these as environment variables
const BLS_API_KEY = process.env.BLS_API_KEY || '';
const HUD_API_KEY = process.env.HUD_API_KEY || '';

// Cache for API responses (key -> { data, timestamp })
const apiCache = new Map();
const API_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (government data updates infrequently)

// Helper function for HTTPS requests
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Ruptura/1.0',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

// POST request helper for BLS API
function httpsPost(url, payload, options = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        ...options.headers
      },
      timeout: 10000,
    };

    const req = https.request(reqOptions, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          reject(new Error(`Invalid JSON: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    req.write(data);
    req.end();
  });
}

// Fetch CPI inflation data from BLS API
async function fetchCPIData(startYear, endYear) {
  const cacheKey = `cpi_${startYear}_${endYear}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < API_CACHE_TTL) {
    return cached.data;
  }

  try {
    // CPI-U All Items series ID
    const seriesId = 'CUUR0000SA0';
    const url = BLS_API_KEY
      ? 'https://api.bls.gov/publicAPI/v2/timeseries/data/'
      : 'https://api.bls.gov/publicAPI/v1/timeseries/data/';

    const payload = {
      seriesid: [seriesId],
      startyear: startYear.toString(),
      endyear: endYear.toString(),
      ...(BLS_API_KEY && { registrationkey: BLS_API_KEY })
    };

    const response = await httpsPost(url, payload);

    if (response.status !== 'REQUEST_SUCCEEDED') {
      throw new Error(`BLS API error: ${response.message || 'Unknown error'}`);
    }

    const data = {};
    if (response.Results && response.Results.series && response.Results.series[0]) {
      const series = response.Results.series[0].data;

      // Calculate year-over-year inflation rates
      const yearlyData = {};
      series.forEach(entry => {
        const year = parseInt(entry.year);
        const period = entry.period;
        const value = parseFloat(entry.value);

        // Use December values for annual comparison
        if (period === 'M12' || period === 'M13') {
          yearlyData[year] = value;
        }
      });

      // Calculate inflation rates
      const years = Object.keys(yearlyData).map(Number).sort();
      for (let i = 1; i < years.length; i++) {
        const currentYear = years[i];
        const previousYear = years[i - 1];
        const inflationRate = (yearlyData[currentYear] - yearlyData[previousYear]) / yearlyData[previousYear];
        data[currentYear] = inflationRate;
      }
    }

    apiCache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('BLS CPI API error:', error.message);
    return null;
  }
}

// Fetch wage data from BLS OEWS API
async function fetchBLSWageData(areaCode) {
  const cacheKey = `bls_wage_${areaCode}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < API_CACHE_TTL) {
    return cached.data;
  }

  try {
    // OEWS series IDs are complex - for now, we'll use a fallback approach
    // The BLS API doesn't provide easy access to OEWS data by MSA
    // Users would need to construct specific series IDs from BLS documentation
    // For production, consider using BLS bulk data files or maintaining series ID mappings

    console.warn('BLS OEWS API integration requires series ID mapping - using fallback');
    return null;
  } catch (error) {
    console.error('BLS OEWS API error:', error.message);
    return null;
  }
}

// Fetch Fair Market Rent data from HUD API
async function fetchHUDRentData(zipCode) {
  const cacheKey = `hud_fmr_${zipCode}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < API_CACHE_TTL) {
    return cached.data;
  }

  if (!HUD_API_KEY) {
    console.warn('HUD_API_KEY not configured - cannot fetch FMR data');
    return null;
  }

  try {
    // HUD API expects a 5-digit ZIP code format
    const formattedZip = zipCode.toString().padStart(5, '0').slice(0, 5);
    const year = new Date().getFullYear();

    const url = `https://www.huduser.gov/hudapi/public/fmr/data/${formattedZip}?year=${year}`;

    const data = await httpsRequest(url, {
      headers: {
        'Authorization': `Bearer ${HUD_API_KEY}`
      }
    });

    if (data && data.data && data.data.basicdata) {
      const fmrData = {
        rent_0br: parseInt(data.data.basicdata.rent_0br) || 0,
        rent_1br: parseInt(data.data.basicdata.rent_1br) || 0,
        rent_2br: parseInt(data.data.basicdata.rent_2br) || 0,
        rent_3br: parseInt(data.data.basicdata.rent_3br) || 0,
        rent_4br: parseInt(data.data.basicdata.rent_4br) || 0,
        area_name: data.data.basicdata.area_name || '',
        county_name: data.data.basicdata.county_name || '',
        state_alpha: data.data.basicdata.state_alpha || ''
      };

      apiCache.set(cacheKey, { data: fmrData, timestamp: Date.now() });
      return fmrData;
    }

    return null;
  } catch (error) {
    console.error('HUD API error:', error.message);
    return null;
  }
}

// Fetch HUD FMR data by state
async function fetchHUDStateData(stateCode) {
  const cacheKey = `hud_state_${stateCode}`;
  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < API_CACHE_TTL) {
    return cached.data;
  }

  if (!HUD_API_KEY) {
    console.warn('HUD_API_KEY not configured - cannot fetch state FMR data');
    return null;
  }

  try {
    const year = new Date().getFullYear();
    const url = `https://www.huduser.gov/hudapi/public/fmr/statedata/${stateCode}?year=${year}`;

    const data = await httpsRequest(url, {
      headers: {
        'Authorization': `Bearer ${HUD_API_KEY}`
      }
    });

    if (data && data.data) {
      apiCache.set(cacheKey, { data: data.data, timestamp: Date.now() });
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('HUD State API error:', error.message);
    return null;
  }
}

// ============================================
// ECON CALCULATOR ROUTES (extracted to routes/econ.js)
// ============================================
app.use(createEconRouter({ db, fetchCPIData, getStateFromZip }));

// ============================================
// INFORMATION ENDPOINTS
// ============================================

// GET /api/map-data - Corporate ownership data by state for the Corporate Conquest Map
app.get('/api/map-data', (req, res) => {
  res.json(STATE_META);
});

// GET /api/economic-data/cpi - Fetch CPI inflation data from BLS
app.get('/api/economic-data/cpi', async (req, res) => {
  const { startYear, endYear } = req.query;
  const start = parseInt(startYear) || 1975;
  const end = parseInt(endYear) || new Date().getFullYear();

  try {
    const cpiData = await fetchCPIData(start, end);

    if (cpiData) {
      res.json({ source: 'BLS_API', data: cpiData });
    } else {
      // Fallback to local data
      const localData = {};
      for (let year = start; year <= end; year++) {
        if (YEARLY_ECONOMIC_DATA[year]) {
          localData[year] = YEARLY_ECONOMIC_DATA[year].cpi_inflation;
        }
      }
      res.json({ source: 'LOCAL_FALLBACK', data: localData });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/economic-data/yearly - Get yearly economic data (productivity, wages, rent burden)
app.get('/api/economic-data/yearly', (req, res) => {
  const { startYear, endYear } = req.query;
  const start = parseInt(startYear) || 1975;
  const end = parseInt(endYear) || new Date().getFullYear();

  const data = {};
  for (let year = start; year <= end; year++) {
    if (YEARLY_ECONOMIC_DATA[year]) {
      data[year] = YEARLY_ECONOMIC_DATA[year];
    }
  }

  res.json({ source: 'LOCAL', data });
});

// GET /api/rent-data/hud/:zipCode - Fetch HUD Fair Market Rent data
app.get('/api/rent-data/hud/:zipCode', async (req, res) => {
  const { zipCode } = req.params;

  try {
    const hudData = await fetchHUDRentData(zipCode);

    if (hudData) {
      res.json({ source: 'HUD_API', data: hudData });
    } else {
      // Fallback to local data
      let localData = db.prepare('SELECT * FROM local_data WHERE zip_code = ?').get(zipCode);
      if (!localData) {
        localData = db.prepare('SELECT * FROM local_data WHERE zip_code = ?').get('default');
      }
      res.json({
        source: 'LOCAL_FALLBACK',
        data: {
          rent_2br: localData.rent,
          area_name: localData.area,
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rent-data/hud/state/:stateCode - Fetch HUD state-wide FMR data
app.get('/api/rent-data/hud/state/:stateCode', async (req, res) => {
  const { stateCode } = req.params;

  try {
    const hudData = await fetchHUDStateData(stateCode);

    if (hudData) {
      res.json({ source: 'HUD_API', data: hudData });
    } else {
      res.json({ source: 'NO_DATA', data: null });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// (Impact calculator, worth-gap-analyzer, negotiation-script, and local-data
//  endpoints have been moved to routes/econ.js)

// GET /api/price-resistance - All price resistance items
app.get('/api/price-resistance', (req, res) => {
  const items = db.prepare('SELECT * FROM price_resistance').all();
  res.json(items.map(item => ({
    id: item.id,
    item: item.item,
    current: item.current_price,
    resistance: item.resistance_price,
    votes: item.votes,
    atResistance: item.at_resistance,
  })));
});

// POST /api/price-resistance/:id/vote - Vote on a price threshold
app.post('/api/price-resistance/:id/vote', (req, res) => {
  const { id } = req.params;
  const { threshold } = req.body;
  if (threshold == null) {
    return res.status(400).json({ error: 'threshold is required' });
  }
  const item = db.prepare('SELECT * FROM price_resistance WHERE id = ?').get(id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  db.prepare('UPDATE price_resistance SET votes = votes + 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

// ============================================
// SENTIMENT ENDPOINTS
// ============================================

// GET /api/sentiment - Get today's sentiment and history
app.get('/api/sentiment', (req, res) => {
  const history = db.prepare('SELECT * FROM sentiment_history ORDER BY id').all();

  // Count today's votes
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const willing = db.prepare(
    "SELECT COUNT(*) as count FROM sentiment_votes WHERE vote = 'yes' AND created_at >= ?"
  ).get(todayStart.toISOString()).count;
  const unwilling = db.prepare(
    "SELECT COUNT(*) as count FROM sentiment_votes WHERE vote = 'no' AND created_at >= ?"
  ).get(todayStart.toISOString()).count;
  const total = willing + unwilling;

  res.json({
    today: { willing, unwilling, total },
    history: history.map(h => ({
      week: h.week,
      willing: h.willing,
      unwilling: h.unwilling,
      total: h.total,
    })),
  });
});

// POST /api/sentiment/vote - Cast a sentiment vote
app.post('/api/sentiment/vote', (req, res) => {
  const { vote, fingerprint } = req.body;
  if (!vote || !['yes', 'no'].includes(vote)) {
    return res.status(400).json({ error: 'vote must be "yes" or "no"' });
  }

  // Check for duplicate fingerprint today
  if (fingerprint) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existing = db.prepare(
      'SELECT id FROM sentiment_votes WHERE fingerprint = ? AND created_at >= ?'
    ).get(fingerprint, todayStart.toISOString());
    if (existing) {
      return res.status(409).json({ error: 'Already voted today' });
    }
  }

  db.prepare('INSERT INTO sentiment_votes (vote, fingerprint) VALUES (?, ?)').run(vote, fingerprint || null);
  res.json({ success: true });
});

// ============================================
// TENANT / BUILDING ENDPOINTS
// ============================================

// GET /api/buildings/:zipCode - Get buildings by ZIP code
app.get('/api/buildings/:zipCode', (req, res) => {
  const { zipCode } = req.params;
  let buildings = db.prepare('SELECT * FROM buildings WHERE zip_code = ?').all(zipCode);
  if (buildings.length === 0) {
    buildings = db.prepare('SELECT * FROM buildings WHERE zip_code = ?').all('default');
  }
  res.json(buildings.map(b => ({
    id: b.id,
    address: b.address,
    units: b.units,
    members: b.members,
    landlord: b.landlord,
    issues: JSON.parse(b.issues),
  })));
});

// POST /api/buildings/:id/join - Join a building's tenant group
app.post('/api/buildings/:id/join', (req, res) => {
  const { id } = req.params;
  const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(id);
  if (!building) {
    return res.status(404).json({ error: 'Building not found' });
  }
  db.prepare('UPDATE buildings SET members = members + 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

// GET /api/buildings/:id/messages - Get messages for a building
app.get('/api/buildings/:id/messages', (req, res) => {
  const { id } = req.params;
  const messages = db.prepare(
    'SELECT * FROM tenant_messages WHERE building_id = ? ORDER BY pinned DESC, created_at DESC'
  ).all(id);
  res.json(messages.map(m => ({
    id: m.id,
    building: m.building_id,
    text: m.text,
    author: m.author,
    pinned: m.pinned === 1,
    replies: m.replies,
    time: timeAgo(m.created_at),
  })));
});

// POST /api/buildings/:id/messages - Post a message to a building
app.post('/api/buildings/:id/messages', (req, res) => {
  const { id } = req.params;
  const { text, author } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  const building = db.prepare('SELECT * FROM buildings WHERE id = ?').get(id);
  if (!building) {
    return res.status(404).json({ error: 'Building not found' });
  }
  const result = db.prepare(
    'INSERT INTO tenant_messages (building_id, text, author) VALUES (?, ?, ?)'
  ).run(id, text, author || 'Anonymous');
  res.json({
    id: result.lastInsertRowid,
    building: id,
    text,
    author: author || 'Anonymous',
    pinned: false,
    replies: 0,
    time: 'Just now',
  });
});

// ============================================
// WORKER COLLECTIVE ENDPOINTS
// ============================================

// GET /api/worker-collectives - List all collectives
app.get('/api/worker-collectives', (req, res) => {
  const collectives = db.prepare('SELECT * FROM worker_collectives ORDER BY members DESC').all();
  res.json(collectives.map(c => ({
    id: c.id,
    industry: c.industry,
    company: c.company,
    members: c.members,
    issues: JSON.parse(c.issues),
    active: c.active === 1,
    telegram_url: c.telegram_url || '',
  })));
});

// POST /api/worker-collectives - Create a new collective
app.post('/api/worker-collectives', (req, res) => {
  const { company, industry, issues, telegram_url } = req.body;
  if (!company || !industry) {
    return res.status(400).json({ error: 'company and industry are required' });
  }
  if (telegram_url && !isValidTelegramUrl(telegram_url)) {
    return res.status(400).json({ error: 'Invalid Telegram URL. Must be a t.me or telegram.me link' });
  }
  const id = `w${Date.now()}`;
  db.prepare(
    'INSERT INTO worker_collectives (id, industry, company, members, issues, active, telegram_url) VALUES (?, ?, ?, 1, ?, 0, ?)'
  ).run(id, industry, company, JSON.stringify(issues || []), telegram_url || '');
  res.json({
    id,
    industry,
    company,
    members: 1,
    issues: issues || [],
    active: false,
    telegram_url: telegram_url || '',
  });
});

// POST /api/worker-collectives/:id/join - Join a collective
app.post('/api/worker-collectives/:id/join', (req, res) => {
  const { id } = req.params;
  const collective = db.prepare('SELECT * FROM worker_collectives WHERE id = ?').get(id);
  if (!collective) {
    return res.status(404).json({ error: 'Collective not found' });
  }
  db.prepare('UPDATE worker_collectives SET members = members + 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

// GET /api/worker-collectives/:id/messages - Get collective messages
app.get('/api/worker-collectives/:id/messages', (req, res) => {
  const { id } = req.params;
  const messages = db.prepare(
    'SELECT * FROM collective_messages WHERE collective_id = ? ORDER BY pinned DESC, created_at DESC'
  ).all(id);
  res.json(messages.map(m => ({
    id: m.id,
    collective: m.collective_id,
    text: m.text,
    author: m.author,
    pinned: m.pinned === 1,
    replies: m.replies,
    time: timeAgo(m.created_at),
  })));
});

// POST /api/worker-collectives/:id/messages - Post a message to a collective
app.post('/api/worker-collectives/:id/messages', (req, res) => {
  const { id } = req.params;
  const { text, author } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }
  const collective = db.prepare('SELECT * FROM worker_collectives WHERE id = ?').get(id);
  if (!collective) {
    return res.status(404).json({ error: 'Collective not found' });
  }
  const result = db.prepare(
    'INSERT INTO collective_messages (collective_id, text, author) VALUES (?, ?, ?)'
  ).run(id, text, author || 'Anonymous');
  res.json({
    id: result.lastInsertRowid,
    collective: id,
    text,
    author: author || 'Anonymous',
    pinned: false,
    replies: 0,
    time: 'Just now',
  });
});

// ============================================
// CONSUMER GROUP ENDPOINTS
// ============================================

// GET /api/consumer-groups - List all consumer groups
app.get('/api/consumer-groups', (req, res) => {
  const groups = db.prepare('SELECT * FROM consumer_groups ORDER BY members DESC').all();
  res.json(groups.map(g => ({
    id: g.id,
    name: g.name,
    members: g.members,
    target: g.target,
    savings: g.savings,
    description: g.description,
  })));
});

// POST /api/consumer-groups/:id/join - Join a consumer group
app.post('/api/consumer-groups/:id/join', (req, res) => {
  const { id } = req.params;
  const group = db.prepare('SELECT * FROM consumer_groups WHERE id = ?').get(id);
  if (!group) {
    return res.status(404).json({ error: 'Consumer group not found' });
  }
  db.prepare('UPDATE consumer_groups SET members = members + 1 WHERE id = ?').run(id);
  res.json({ success: true });
});

// ============================================
// PETITION ENDPOINTS
// ============================================

// GET /api/petitions - List all petitions
app.get('/api/petitions', (req, res) => {
  const petitions = db.prepare('SELECT * FROM petitions ORDER BY created_at DESC').all();
  res.json(petitions.map(p => ({
    id: p.id,
    title: p.title,
    area: p.area,
    description: p.description,
    changeorg_url: p.changeorg_url,
    signatures: p.signatures,
    goal: p.goal,
    status: p.status,
    created: timeAgo(p.created_at),
  })));
});

// POST /api/petitions - Create a petition (requires Change.org URL)
app.post('/api/petitions', async (req, res) => {
  const { title, area, description, changeorg_url } = req.body;
  if (!title || !area || !changeorg_url) {
    return res.status(400).json({ error: 'title, area, and changeorg_url are required' });
  }
  if (!isValidChangeOrgUrl(changeorg_url)) {
    return res.status(400).json({ error: 'A valid Change.org URL is required' });
  }

  // Try to fetch signature data from Change.org
  let signatures = 0;
  let goal = 100;
  try {
    const data = await fetchChangeOrgData(changeorg_url);
    if (data.signatures !== null) signatures = data.signatures;
    if (data.goal !== null) goal = data.goal;
  } catch {
    // Could not reach Change.org — use defaults, will refresh later
  }

  const id = `p${Date.now()}`;
  db.prepare(
    'INSERT INTO petitions (id, title, area, description, changeorg_url, signatures, goal, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, area, description || '', changeorg_url, signatures, goal, 'active');
  res.json({
    id,
    title,
    area,
    description: description || '',
    changeorg_url,
    signatures,
    goal,
    status: 'active',
    created: 'Just now',
  });
});

// POST /api/petitions/:id/refresh - Refresh signature data from Change.org
app.post('/api/petitions/:id/refresh', async (req, res) => {
  const { id } = req.params;
  const petition = db.prepare('SELECT * FROM petitions WHERE id = ?').get(id);
  if (!petition) {
    return res.status(404).json({ error: 'Petition not found' });
  }
  if (!petition.changeorg_url) {
    return res.status(400).json({ error: 'No Change.org URL linked' });
  }

  try {
    const data = await fetchChangeOrgData(petition.changeorg_url);
    const newSigs = data.signatures !== null ? data.signatures : petition.signatures;
    const newGoal = data.goal !== null ? data.goal : petition.goal;
    const newStatus = newSigs >= newGoal ? 'won' : petition.status;
    db.prepare('UPDATE petitions SET signatures = ?, goal = ?, status = ? WHERE id = ?')
      .run(newSigs, newGoal, newStatus, id);
    res.json({ success: true, signatures: newSigs, goal: newGoal, status: newStatus });
  } catch {
    res.json({ success: false, signatures: petition.signatures, goal: petition.goal, status: petition.status });
  }
});

// ============================================
// REPORT ENDPOINTS
// ============================================

// GET /api/reports - List all reports with optional filter
app.get('/api/reports', (req, res) => {
  const { type } = req.query;
  let reports;
  if (type && type !== 'all') {
    reports = db.prepare('SELECT * FROM reports WHERE type = ? ORDER BY last_report DESC').all(type);
  } else {
    reports = db.prepare('SELECT * FROM reports ORDER BY last_report DESC').all();
  }
  res.json(reports.map(r => ({
    id: r.id,
    type: r.type,
    name: r.name,
    address: r.address,
    issues: JSON.parse(r.issues),
    reports: r.report_count,
    lastReport: timeAgo(r.last_report),
  })));
});

// POST /api/reports - Submit a report
app.post('/api/reports', (req, res) => {
  const { type, name, address, issues, description } = req.body;
  if (!type || !name || !issues || issues.length === 0) {
    return res.status(400).json({ error: 'type, name, and at least one issue are required' });
  }

  // Check if entity already exists
  const existing = db.prepare(
    'SELECT * FROM reports WHERE LOWER(name) = LOWER(?) AND type = ?'
  ).get(name, type);

  if (existing) {
    db.prepare(
      'UPDATE reports SET report_count = report_count + 1, last_report = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(existing.id);
    return res.json({
      id: existing.id,
      type: existing.type,
      name: existing.name,
      address: existing.address,
      issues: JSON.parse(existing.issues),
      reports: existing.report_count + 1,
      lastReport: 'Just now',
      merged: true,
    });
  }

  const id = `r${Date.now()}`;
  db.prepare(
    'INSERT INTO reports (id, type, name, address, issues, report_count) VALUES (?, ?, ?, ?, ?, 1)'
  ).run(id, type, name, address || null, JSON.stringify(issues));
  res.json({
    id,
    type,
    name,
    address: address || null,
    issues,
    reports: 1,
    lastReport: 'Just now',
    merged: false,
  });
});

// ============================================
// RUPTURA ECONOMIC EXPERIENCE (econ.ruptura.co)
// ============================================

app.get('/econ', (req, res) => {
  res.sendFile(path.join(__dirname, 'econ.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`Ruptura backend running on port ${PORT}`);
  console.log(`Ruptura Economic Experience available at http://localhost:${PORT}/econ`);
});

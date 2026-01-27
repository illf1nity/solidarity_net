const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const { getDatabase } = require('./db');

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
        'User-Agent': 'Mozilla/5.0 (compatible; SolidarityNet/1.0)',
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
// INFORMATION ENDPOINTS
// ============================================

// GET /api/local-data/:zipCode - Cost of living data by ZIP code
app.get('/api/local-data/:zipCode', (req, res) => {
  const { zipCode } = req.params;
  let data = db.prepare('SELECT * FROM local_data WHERE zip_code = ?').get(zipCode);
  if (!data) {
    data = db.prepare('SELECT * FROM local_data WHERE zip_code = ?').get('default');
  }
  res.json({
    medianWage: data.median_wage,
    rent: data.rent,
    food: data.food,
    healthcare: data.healthcare,
    transport: data.transport,
    utilities: data.utilities,
    area: data.area,
  });
});

// GET /api/theft-calculator - Calculate personalized economic theft metrics
app.get('/api/theft-calculator', (req, res) => {
  const { age, income, zip } = req.query;
  const userAge = parseInt(age, 10);
  const userIncome = parseFloat(income);

  if (!userAge || userAge < 18 || userAge > 100) {
    return res.status(400).json({ error: 'age must be between 18 and 100' });
  }
  if (!userIncome || userIncome <= 0) {
    return res.status(400).json({ error: 'income must be a positive number' });
  }

  // Fetch historical data from DB
  const historical = db.prepare('SELECT * FROM historical_economic_data WHERE id = 1').get();
  // Fetch location-specific data if zip provided
  let locationData = null;
  if (zip) {
    locationData = db.prepare('SELECT * FROM local_data WHERE zip_code = ?').get(zip);
    if (!locationData) {
      locationData = db.prepare('SELECT * FROM local_data WHERE zip_code = ?').get('default');
    }
  }

  const workingYears = userAge - 18;
  const yearsToRetirement = Math.max(0, 65 - userAge);

  // -- HOUSING (time-based, not dollars) --
  // In 1985, median home cost 3.5 years of income. Now it costs 7.5 years.
  // Show the extra working years needed — not a dollar figure.
  const historicalHomeRatio = historical.home_price_to_income_1985;
  const currentHomeRatio = historical.home_price_to_income_now;
  const extraYearsToBuyHome = currentHomeRatio - historicalHomeRatio;

  // -- WAGE THEFT (productivity vs pay gap) --
  // Since 1979, productivity rose ~70% but wages only ~17%.
  const productivityGap = historical.productivity_growth_since_1979;
  const wageGrowth = historical.wage_growth_since_1979;
  const wageGapPct = productivityGap - wageGrowth;
  const annualWageTheft = Math.round(userIncome * (wageGapPct / 100));
  const lifetimeEarningsTheft = annualWageTheft * workingYears;

  // -- DEBT BURDEN --
  // Average student + medical debt normalized by income relative to median
  const medianIncome = historical.median_household_income;
  const incomeRatio = userIncome / medianIncome;
  const avgStudentDebt = historical.avg_student_debt;
  const avgMedicalDebt = historical.avg_medical_debt;
  const debtBurden = Math.round((avgStudentDebt + avgMedicalDebt) * Math.min(incomeRatio, 1.5));

  // -- RENT EXTRACTION --
  // In 1985 rent was ~25% of income; now it's ~35% nationally.
  const rentPctThen = historical.rent_pct_income_1985;
  const rentPctNow = historical.rent_pct_income_now;
  const excessRentPct = (rentPctNow - rentPctThen) / 100;
  const annualRentTheft = Math.round(userIncome * excessRentPct);
  const lifetimeRentTheft = annualRentTheft * workingYears;

  // -- TOTALS (dollars: earnings + debt + rent only) --
  const totalLifetimeTheft = lifetimeEarningsTheft + debtBurden + lifetimeRentTheft;
  const yearsOfWorkStolen = totalLifetimeTheft > 0 ? (totalLifetimeTheft / userIncome).toFixed(1) : '0.0';
  const projectedFutureTheft = (annualWageTheft + annualRentTheft) * yearsToRetirement;

  res.json({
    inputs: { age: userAge, income: userIncome, zip: zip || null },
    metrics: {
      housing: {
        label: 'Housing Affordability Lost',
        yearsIn1985: historicalHomeRatio,
        yearsNow: currentHomeRatio,
        extraYears: extraYearsToBuyHome,
        detail: `A home costs ${currentHomeRatio.toFixed(1)} years of income today vs ${historicalHomeRatio.toFixed(1)} in 1985`,
      },
      earnings: {
        label: 'Wages Stolen by Productivity Gap',
        amount: lifetimeEarningsTheft,
        annualAmount: annualWageTheft,
        detail: `Productivity up ${productivityGap}% since 1979, wages only up ${wageGrowth}%`,
      },
      debt: {
        label: 'Systemic Debt Burden',
        amount: debtBurden,
        detail: `Student + medical debt normalized to your income level`,
      },
      rent: {
        label: 'Excess Rent Extracted',
        amount: lifetimeRentTheft,
        annualAmount: annualRentTheft,
        detail: `Rent takes ${rentPctNow}% of income now vs ${rentPctThen}% in 1985`,
      },
    },
    totals: {
      lifetimeTheft: totalLifetimeTheft,
      yearsOfWorkStolen: parseFloat(yearsOfWorkStolen),
      projectedFutureTheft: projectedFutureTheft,
      workingYears: workingYears,
      yearsToRetirement: yearsToRetirement,
    },
    sources: [
      'Economic Policy Institute (productivity-pay gap)',
      'Federal Reserve (household debt data)',
      'Census Bureau (median income)',
      'HUD / Zillow (housing cost trends)',
      'BLS (rent & CPI data)',
    ],
  });
});

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
  })));
});

// POST /api/worker-collectives - Create a new collective
app.post('/api/worker-collectives', (req, res) => {
  const { company, industry, issues } = req.body;
  if (!company || !industry) {
    return res.status(400).json({ error: 'company and industry are required' });
  }
  const id = `w${Date.now()}`;
  db.prepare(
    'INSERT INTO worker_collectives (id, industry, company, members, issues, active) VALUES (?, ?, ?, 1, ?, 0)'
  ).run(id, industry, company, JSON.stringify(issues || []));
  res.json({
    id,
    industry,
    company,
    members: 1,
    issues: issues || [],
    active: false,
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
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`SOLIDARITY_NET backend running on port ${PORT}`);
});

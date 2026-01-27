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
// TELEGRAM SCRAPING
// ============================================

// Cache for Telegram data (URL -> { members, timestamp })
const telegramCache = new Map();
const TELEGRAM_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function parseTelegramCount(value, suffix = '') {
  if (!value) return null;
  const normalized = value.replace(/,/g, '').trim();
  const number = parseFloat(normalized);
  if (Number.isNaN(number)) return null;
  const suffixLower = suffix.toLowerCase();
  if (suffixLower === 'k') return Math.round(number * 1000);
  if (suffixLower === 'm') return Math.round(number * 1000000);
  if (suffixLower === 'b') return Math.round(number * 1000000000);
  return Math.round(number);
}

function parseTelegramPage(html) {
  const visibleMatch = html.match(/([\d,.]+)\s*([kmb])?\s+(?:members|subscribers)/i);
  if (visibleMatch) {
    return { members: parseTelegramCount(visibleMatch[1], visibleMatch[2]) };
  }

  const metaMatch = html.match(/"(?:members|subscribers)"\s*:\s*"?(?<count>[\d,.]+)"?/i);
  if (metaMatch && metaMatch.groups?.count) {
    return { members: parseTelegramCount(metaMatch.groups.count) };
  }

  return { members: null };
}

function fetchTelegramData(url) {
  return new Promise((resolve, reject) => {
    const cached = telegramCache.get(url);
    if (cached && Date.now() - cached.timestamp < TELEGRAM_CACHE_TTL) {
      return resolve({ members: cached.members });
    }

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SolidarityNet/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 8000,
    }, (res) => {
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

function isValidTelegramUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 't.me' || parsed.hostname === 'telegram.me';
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
// TENANT UNION / ORGANIZATION ENDPOINTS
// ============================================

// GET /api/petitions - List all tenant unions
app.get('/api/petitions', (req, res) => {
  const petitions = db.prepare('SELECT * FROM petitions ORDER BY created_at DESC').all();
  res.json(petitions.map(p => ({
    id: p.id,
    title: p.title,
    area: p.area,
    description: p.description,
    telegram_url: p.telegram_url,
    members: p.signatures,
    status: p.status,
    created: timeAgo(p.created_at),
  })));
});

// POST /api/petitions - Create a tenant union (requires Telegram URL)
app.post('/api/petitions', async (req, res) => {
  const { title, area, description, telegram_url } = req.body;
  if (!title || !area || !telegram_url) {
    return res.status(400).json({ error: 'title, area, and telegram_url are required' });
  }
  if (!isValidTelegramUrl(telegram_url)) {
    return res.status(400).json({ error: 'A valid Telegram URL is required' });
  }

  // Try to fetch member data from Telegram
  let members = 0;
  try {
    const data = await fetchTelegramData(telegram_url);
    if (data.members !== null) members = data.members;
  } catch {
    // Could not reach Telegram — use defaults, will refresh later
  }

  const id = `p${Date.now()}`;
  db.prepare(
    'INSERT INTO petitions (id, title, area, description, telegram_url, signatures, goal, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, title, area, description || '', telegram_url, members, 0, 'active');
  res.json({
    id,
    title,
    area,
    description: description || '',
    telegram_url,
    members,
    status: 'active',
    created: 'Just now',
  });
});

// POST /api/petitions/:id/refresh - Refresh member data from Telegram
app.post('/api/petitions/:id/refresh', async (req, res) => {
  const { id } = req.params;
  const petition = db.prepare('SELECT * FROM petitions WHERE id = ?').get(id);
  if (!petition) {
    return res.status(404).json({ error: 'Petition not found' });
  }
  if (!petition.telegram_url) {
    return res.status(400).json({ error: 'No Telegram URL linked' });
  }

  try {
    const data = await fetchTelegramData(petition.telegram_url);
    const newMembers = data.members !== null ? data.members : petition.signatures;
    const newStatus = petition.status;
    db.prepare('UPDATE petitions SET signatures = ?, goal = ?, status = ? WHERE id = ?')
      .run(newMembers, 0, newStatus, id);
    res.json({ success: true, members: newMembers, status: newStatus });
  } catch {
    res.json({ success: false, members: petition.signatures, status: petition.status });
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

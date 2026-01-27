const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'solidarity.db');

function initializeDatabase() {
  const db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ============================================
  // SCHEMA
  // ============================================

  db.exec(`
    CREATE TABLE IF NOT EXISTS local_data (
      zip_code TEXT PRIMARY KEY,
      area TEXT NOT NULL,
      median_wage REAL NOT NULL,
      rent REAL NOT NULL,
      food REAL NOT NULL,
      healthcare REAL NOT NULL,
      transport REAL NOT NULL,
      utilities REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY,
      zip_code TEXT NOT NULL,
      address TEXT NOT NULL,
      units INTEGER NOT NULL,
      members INTEGER NOT NULL DEFAULT 0,
      landlord TEXT NOT NULL,
      issues TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS tenant_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id TEXT NOT NULL,
      text TEXT NOT NULL,
      author TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      replies INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    );

    CREATE TABLE IF NOT EXISTS worker_collectives (
      id TEXT PRIMARY KEY,
      industry TEXT NOT NULL,
      company TEXT NOT NULL,
      members INTEGER NOT NULL DEFAULT 0,
      issues TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS collective_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collective_id TEXT NOT NULL,
      text TEXT NOT NULL,
      author TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      replies INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collective_id) REFERENCES worker_collectives(id)
    );

    CREATE TABLE IF NOT EXISTS consumer_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      members INTEGER NOT NULL DEFAULT 0,
      target TEXT NOT NULL,
      savings TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS petitions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      area TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      signatures INTEGER NOT NULL DEFAULT 0,
      goal INTEGER NOT NULL DEFAULT 100,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('landlord', 'employer')),
      name TEXT NOT NULL,
      address TEXT,
      issues TEXT NOT NULL DEFAULT '[]',
      report_count INTEGER NOT NULL DEFAULT 1,
      last_report DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS price_resistance (
      id TEXT PRIMARY KEY,
      item TEXT NOT NULL,
      current_price REAL NOT NULL,
      resistance_price REAL NOT NULL,
      votes INTEGER NOT NULL DEFAULT 0,
      at_resistance INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sentiment_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vote TEXT NOT NULL CHECK(vote IN ('yes', 'no')),
      fingerprint TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sentiment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week TEXT NOT NULL,
      willing INTEGER NOT NULL DEFAULT 0,
      unwilling INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0
    );
  `);

  return db;
}

function seedDatabase(db) {
  const localDataCount = db.prepare('SELECT COUNT(*) as count FROM local_data').get().count;
  if (localDataCount > 0) return;

  // Seed local_data
  const insertLocalData = db.prepare(`
    INSERT INTO local_data (zip_code, area, median_wage, rent, food, healthcare, transport, utilities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const localData = [
    ['10001', 'Manhattan, NY', 22.00, 3200, 520, 420, 150, 160],
    ['90210', 'Beverly Hills, CA', 24.00, 2800, 580, 450, 350, 140],
    ['48127', 'Dearborn, MI', 16.50, 1100, 380, 320, 300, 200],
    ['30301', 'Atlanta, GA', 17.80, 1650, 420, 380, 320, 190],
    ['60601', 'Chicago, IL', 19.50, 1850, 440, 360, 120, 170],
    ['98101', 'Seattle, WA', 23.00, 2100, 480, 400, 140, 150],
    ['02101', 'Boston, MA', 21.50, 2400, 500, 390, 100, 165],
    ['78201', 'San Antonio, TX', 16.00, 1200, 400, 340, 280, 175],
    ['85001', 'Phoenix, AZ', 17.25, 1400, 420, 350, 300, 200],
    ['default', 'National Average', 18.50, 1750, 450, 350, 280, 180],
  ];

  const seedLocalData = db.transaction(() => {
    for (const row of localData) {
      insertLocalData.run(...row);
    }
  });
  seedLocalData();

  // Seed buildings
  const insertBuilding = db.prepare(`
    INSERT INTO buildings (id, zip_code, address, units, members, landlord, issues)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const buildings = [
    ['b1', '10001', '123 Main St, Apt 1-24', 24, 8, 'Greystone Properties', '["Heat","Repairs"]'],
    ['b2', '10001', '456 Oak Ave, Units A-L', 12, 3, 'Metro Housing LLC', '["Fees"]'],
    ['b3', '10001', '789 Park Blvd', 48, 15, 'Urban Living Corp', '["Security","Pests"]'],
    ['b4', '60601', '100 Lake Shore Dr', 200, 42, 'Lakeside Management', '["Rent increases"]'],
    ['b5', '60601', '250 State St', 36, 11, 'Downtown Rentals Inc', '["Maintenance"]'],
    ['b6', '90210', '9000 Wilshire Blvd', 80, 22, 'Luxury Living LA', '["Parking","Amenities"]'],
    ['b7', 'default', '500 Example St', 20, 5, 'Sample Properties', '["General"]'],
  ];

  const seedBuildings = db.transaction(() => {
    for (const row of buildings) {
      insertBuilding.run(...row);
    }
  });
  seedBuildings();

  // Seed tenant messages
  const insertTenantMessage = db.prepare(`
    INSERT INTO tenant_messages (building_id, text, author, pinned, replies, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const tenantMessages = [
    ['b1', 'Anyone else having issues with heat? Third time this month.', 'Unit 12', 0, 4, '-1 hours'],
    ['b1', 'Landlord ignored my repair request for 3 weeks. Documenting everything.', 'Unit 8', 0, 7, '-3 hours'],
    ['b1', 'Meeting in lobby Saturday 2pm to discuss organizing. All welcome.', 'Unit 3', 1, 12, '-6 hours'],
    ['b4', 'They just announced another rent increase. We need to coordinate response.', 'Floor 15', 0, 23, '-2 hours'],
    ['b4', 'Has anyone contacted a tenants rights lawyer?', 'Floor 7', 0, 8, '-4 hours'],
  ];

  const seedTenantMessages = db.transaction(() => {
    for (const row of tenantMessages) {
      insertTenantMessage.run(...row);
    }
  });
  seedTenantMessages();

  // Seed worker collectives
  const insertCollective = db.prepare(`
    INSERT INTO worker_collectives (id, industry, company, members, issues, active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const collectives = [
    ['w1', 'Retail', 'MegaMart', 127, '["Scheduling","Understaffing"]', 1],
    ['w2', 'Food Service', 'QuickBite Chain', 89, '["Wage theft","No breaks"]', 1],
    ['w3', 'Warehouse', 'FastShip Logistics', 234, '["Safety","Quotas"]', 1],
    ['w4', 'Healthcare', 'CareFirst Hospital', 156, '["Understaffing","Mandatory OT"]', 1],
    ['w5', 'Tech', 'Anonymous Startup', 45, '["Layoffs","RTO mandate"]', 0],
    ['w6', 'Education', 'City School District', 312, '["Class sizes","Resources"]', 1],
  ];

  const seedCollectives = db.transaction(() => {
    for (const row of collectives) {
      insertCollective.run(...row);
    }
  });
  seedCollectives();

  // Seed collective messages
  const insertCollectiveMessage = db.prepare(`
    INSERT INTO collective_messages (collective_id, text, author, pinned, replies, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const collectiveMessages = [
    ['w1', 'Meeting Thursday 6pm - discussing schedule changes. Location TBD.', 'Organizer', 1, 0, '-2 hours'],
    ['w1', 'Anyone else get their hours cut this week? Third week in a row for me.', 'Anonymous', 0, 12, '-5 hours'],
    ['w1', 'New hire orientation is lying about break policies. We should document.', 'Anonymous', 0, 6, '-8 hours'],
    ['w3', 'Safety incident on loading dock yesterday. Management said nothing. Anyone have details?', 'Anonymous', 0, 18, '-3 hours'],
  ];

  const seedCollectiveMessages = db.transaction(() => {
    for (const row of collectiveMessages) {
      insertCollectiveMessage.run(...row);
    }
  });
  seedCollectiveMessages();

  // Seed consumer groups
  const insertConsumerGroup = db.prepare(`
    INSERT INTO consumer_groups (id, name, members, target, savings, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const consumerGroups = [
    ['c1', 'Internet Access Collective', 342, 'ISP bulk negotiation', '$15/mo avg', 'Negotiating group rates with local ISPs'],
    ['c2', 'Grocery Bulk Buy', 89, 'Wholesale access', '$80/mo avg', 'Weekly bulk orders from wholesalers'],
    ['c3', 'Utility Bill Co-op', 156, 'Solar installation', '$45/mo avg', 'Community solar purchasing program'],
    ['c4', 'Prescription Pool', 203, 'Medication costs', '$120/mo avg', 'Group purchasing for common medications'],
  ];

  const seedConsumerGroups = db.transaction(() => {
    for (const row of consumerGroups) {
      insertConsumerGroup.run(...row);
    }
  });
  seedConsumerGroups();

  // Seed petitions
  const insertPetition = db.prepare(`
    INSERT INTO petitions (id, title, area, description, signatures, goal, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const petitions = [
    ['p1', 'Stop Rent Increase at 123 Main St', '10001', 'Landlord proposing 15% increase despite no improvements.', 18, 24, 'active', '-2 days'],
    ['p2', 'Demand Fair Scheduling at MegaMart', '60601', 'End on-call scheduling and provide 2-week advance notice.', 89, 100, 'active', '-7 days'],
    ['p3', 'Fix Dangerous Intersection on Oak Ave', '10001', 'Traffic light installed after petition delivered to city council.', 156, 150, 'won', '-21 days'],
    ['p4', 'Oppose Utility Rate Hike', '30301', 'Power company requesting 22% rate increase.', 423, 500, 'active', '-4 days'],
    ['p5', 'Keep Community Health Clinic Open', '48127', 'Only clinic serving uninsured residents in the area.', 267, 300, 'active', '-5 days'],
  ];

  const seedPetitions = db.transaction(() => {
    for (const row of petitions) {
      insertPetition.run(...row);
    }
  });
  seedPetitions();

  // Seed reports
  const insertReport = db.prepare(`
    INSERT INTO reports (id, type, name, address, issues, report_count, last_report)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const reports = [
    ['r1', 'landlord', 'Greystone Properties', '123 Main St', '["No repairs","Harassment"]', 12, '-2 hours'],
    ['r2', 'employer', 'QuickBite Chain', null, '["Wage theft","No breaks"]', 34, '-5 hours'],
    ['r3', 'landlord', 'Metro Housing LLC', '456 Oak Ave', '["Safety hazard","Illegal fees"]', 7, '-1 days'],
    ['r4', 'employer', 'FastShip Logistics', null, '["Unsafe conditions","Retaliation"]', 56, '-3 hours'],
    ['r5', 'landlord', 'Urban Living Corp', '789 Park Blvd', '["Pest infestation","No heat"]', 23, '-8 hours'],
  ];

  const seedReports = db.transaction(() => {
    for (const row of reports) {
      insertReport.run(...row);
    }
  });
  seedReports();

  // Seed price resistance
  const insertPriceResistance = db.prepare(`
    INSERT INTO price_resistance (id, item, current_price, resistance_price, votes, at_resistance)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const priceResistance = [
    ['pr1', 'Gallon of Gas', 3.45, 4.50, 1247, 72],
    ['pr2', 'Dozen Eggs', 4.20, 5.00, 892, 85],
    ['pr3', 'Gallon of Milk', 3.80, 5.00, 756, 68],
    ['pr4', 'Loaf of Bread', 3.50, 4.50, 634, 55],
    ['pr5', 'Internet (Basic)', 65, 80, 1089, 45],
    ['pr6', 'Electricity (avg/mo)', 150, 200, 923, 38],
    ['pr7', 'Ground Beef (1 lb)', 5.50, 7.00, 445, 62],
    ['pr8', 'Streaming Service', 15.99, 20.00, 1567, 78],
  ];

  const seedPriceResistance = db.transaction(() => {
    for (const row of priceResistance) {
      insertPriceResistance.run(...row);
    }
  });
  seedPriceResistance();

  // Seed sentiment history
  const insertSentimentHistory = db.prepare(`
    INSERT INTO sentiment_history (week, willing, unwilling, total)
    VALUES (?, ?, ?, ?)
  `);

  const sentimentHistory = [
    ['W1', 45, 55, 87],
    ['W2', 42, 58, 92],
    ['W3', 38, 62, 103],
    ['W4', 31, 69, 98],
  ];

  const seedSentimentHistory = db.transaction(() => {
    for (const row of sentimentHistory) {
      insertSentimentHistory.run(...row);
    }
  });
  seedSentimentHistory();

  // Seed today's sentiment votes
  const insertSentimentVote = db.prepare(`
    INSERT INTO sentiment_votes (vote, fingerprint, created_at)
    VALUES (?, ?, datetime('now'))
  `);

  const seedSentimentVotes = db.transaction(() => {
    for (let i = 0; i < 23; i++) {
      insertSentimentVote.run('yes', `seed_willing_${i}`);
    }
    for (let i = 0; i < 67; i++) {
      insertSentimentVote.run('no', `seed_unwilling_${i}`);
    }
  });
  seedSentimentVotes();

  console.log('Database seeded successfully.');
}

function getDatabase() {
  const db = initializeDatabase();
  seedDatabase(db);
  return db;
}

module.exports = { getDatabase };

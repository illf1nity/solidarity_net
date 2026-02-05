// ============================================
// FORUM DATABASE SCHEMA & SEED DATA
// ============================================
// Anonymity-first forum system. User accounts collect
// only an alias and a passphrase hash — no email,
// no real name, no IP logging.

const crypto = require('crypto');

function hashPassphrase(passphrase) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(passphrase, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassphrase(passphrase, stored) {
  const [salt, hash] = stored.split(':');
  const verify = crypto.scryptSync(passphrase, salt, 64).toString('hex');
  return hash === verify;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function initializeForumSchema(db) {
  db.exec(`
    -- Anonymous user accounts: alias + passphrase only
    CREATE TABLE IF NOT EXISTS forum_users (
      id TEXT PRIMARY KEY,
      alias TEXT NOT NULL UNIQUE,
      passphrase_hash TEXT NOT NULL,
      avatar_color TEXT NOT NULL DEFAULT '#ff3333',
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'moderator', 'admin')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Session tokens for stateless auth
    CREATE TABLE IF NOT EXISTS forum_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES forum_users(id)
    );

    -- Boards (4 unnamed by default, editable via admin tool)
    CREATE TABLE IF NOT EXISTS forum_boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0,
      locked INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Threads within boards
    CREATE TABLE IF NOT EXISTS forum_threads (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      author_id TEXT NOT NULL,
      pinned INTEGER NOT NULL DEFAULT 0,
      locked INTEGER NOT NULL DEFAULT 0,
      reply_count INTEGER NOT NULL DEFAULT 0,
      last_activity DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (board_id) REFERENCES forum_boards(id),
      FOREIGN KEY (author_id) REFERENCES forum_users(id)
    );

    -- Posts within threads
    CREATE TABLE IF NOT EXISTS forum_posts (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      body TEXT NOT NULL,
      edited INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES forum_threads(id),
      FOREIGN KEY (author_id) REFERENCES forum_users(id)
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_forum_threads_board ON forum_threads(board_id);
    CREATE INDEX IF NOT EXISTS idx_forum_threads_activity ON forum_threads(last_activity DESC);
    CREATE INDEX IF NOT EXISTS idx_forum_posts_thread ON forum_posts(thread_id);
    CREATE INDEX IF NOT EXISTS idx_forum_sessions_user ON forum_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_forum_sessions_expires ON forum_sessions(expires_at);
  `);
}

function seedForumData(db) {
  const boardCount = db.prepare('SELECT COUNT(*) as count FROM forum_boards').get().count;
  if (boardCount > 0) return;

  // Create 4 unnamed boards
  const insertBoard = db.prepare(
    'INSERT INTO forum_boards (id, name, description, position) VALUES (?, ?, ?, ?)'
  );

  const seedBoards = db.transaction(() => {
    insertBoard.run('board_1', '', '', 0);
    insertBoard.run('board_2', '', '', 1);
    insertBoard.run('board_3', '', '', 2);
    insertBoard.run('board_4', '', '', 3);
  });
  seedBoards();

  // Create a default admin account (alias: admin, passphrase: solidarity)
  const adminId = 'u_admin';
  const adminHash = hashPassphrase('solidarity');
  db.prepare(
    'INSERT INTO forum_users (id, alias, passphrase_hash, avatar_color, role) VALUES (?, ?, ?, ?, ?)'
  ).run(adminId, 'admin', adminHash, '#ff3333', 'admin');

  console.log('Forum database seeded: 4 boards + admin account created.');
}

module.exports = {
  initializeForumSchema,
  seedForumData,
  hashPassphrase,
  verifyPassphrase,
  generateToken,
};

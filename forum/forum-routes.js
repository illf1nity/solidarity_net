// ============================================
// FORUM API ROUTES
// ============================================
// All forum endpoints live under /api/forum/*
// Auth is token-based via x-forum-token header.

const crypto = require('crypto');
const path = require('path');
const {
  hashPassphrase,
  verifyPassphrase,
  generateToken,
} = require('./forum-db');

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${diffWeeks}w ago`;
}

// Middleware: resolve current user from token (attaches req.forumUser or null)
function authMiddleware(db) {
  return (req, res, next) => {
    const token = req.headers['x-forum-token'];
    req.forumUser = null;

    if (token) {
      // Clean expired sessions
      db.prepare('DELETE FROM forum_sessions WHERE expires_at < datetime(\'now\')').run();

      const session = db.prepare(
        'SELECT s.user_id, u.alias, u.avatar_color, u.role FROM forum_sessions s JOIN forum_users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > datetime(\'now\')'
      ).get(token);

      if (session) {
        req.forumUser = {
          id: session.user_id,
          alias: session.alias,
          avatarColor: session.avatar_color,
          role: session.role,
        };
      }
    }
    next();
  };
}

// Middleware: require authenticated user
function requireAuth(req, res, next) {
  if (!req.forumUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware: require admin role
function requireAdmin(req, res, next) {
  if (!req.forumUser || req.forumUser.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

function registerForumRoutes(app, db) {
  // Apply auth middleware to all /api/forum routes
  app.use('/api/forum', authMiddleware(db));

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  // POST /api/forum/register — create anonymous account
  // Only requires: alias, passphrase
  app.post('/api/forum/register', (req, res) => {
    const { alias, passphrase } = req.body;

    if (!alias || !passphrase) {
      return res.status(400).json({ error: 'alias and passphrase are required' });
    }

    if (alias.length < 2 || alias.length > 30) {
      return res.status(400).json({ error: 'alias must be 2-30 characters' });
    }

    if (passphrase.length < 6) {
      return res.status(400).json({ error: 'passphrase must be at least 6 characters' });
    }

    // Check alias uniqueness
    const existing = db.prepare('SELECT id FROM forum_users WHERE LOWER(alias) = LOWER(?)').get(alias);
    if (existing) {
      return res.status(409).json({ error: 'alias is already taken' });
    }

    const id = `u_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const hash = hashPassphrase(passphrase);
    const colors = ['#ff3333', '#ff6633', '#ffcc33', '#33ff66', '#33ccff', '#9966ff', '#ff33cc', '#33ffcc'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    db.prepare(
      'INSERT INTO forum_users (id, alias, passphrase_hash, avatar_color) VALUES (?, ?, ?, ?)'
    ).run(id, alias, hash, avatarColor);

    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    db.prepare(
      'INSERT INTO forum_sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).run(token, id, expiresAt);

    res.json({
      token,
      user: { id, alias, avatarColor, role: 'user' },
    });
  });

  // POST /api/forum/login — authenticate with alias + passphrase
  app.post('/api/forum/login', (req, res) => {
    const { alias, passphrase } = req.body;

    if (!alias || !passphrase) {
      return res.status(400).json({ error: 'alias and passphrase are required' });
    }

    const user = db.prepare('SELECT * FROM forum_users WHERE LOWER(alias) = LOWER(?)').get(alias);
    if (!user || !verifyPassphrase(passphrase, user.passphrase_hash)) {
      return res.status(401).json({ error: 'invalid alias or passphrase' });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO forum_sessions (token, user_id, expires_at) VALUES (?, ?, ?)'
    ).run(token, user.id, expiresAt);

    res.json({
      token,
      user: {
        id: user.id,
        alias: user.alias,
        avatarColor: user.avatar_color,
        role: user.role,
      },
    });
  });

  // POST /api/forum/logout — destroy session
  app.post('/api/forum/logout', requireAuth, (req, res) => {
    const token = req.headers['x-forum-token'];
    db.prepare('DELETE FROM forum_sessions WHERE token = ?').run(token);
    res.json({ success: true });
  });

  // GET /api/forum/me — current user info
  app.get('/api/forum/me', requireAuth, (req, res) => {
    res.json({ user: req.forumUser });
  });

  // ============================================
  // BOARD ENDPOINTS
  // ============================================

  // GET /api/forum/boards — list all boards
  app.get('/api/forum/boards', (req, res) => {
    const boards = db.prepare(
      'SELECT * FROM forum_boards ORDER BY position ASC'
    ).all();

    const result = boards.map(b => {
      const threadCount = db.prepare(
        'SELECT COUNT(*) as count FROM forum_threads WHERE board_id = ?'
      ).get(b.id).count;

      const postCount = db.prepare(
        'SELECT COUNT(*) as count FROM forum_posts p JOIN forum_threads t ON t.id = p.thread_id WHERE t.board_id = ?'
      ).get(b.id).count;

      const lastThread = db.prepare(
        'SELECT t.title, t.last_activity, u.alias as last_author FROM forum_threads t JOIN forum_users u ON u.id = t.author_id WHERE t.board_id = ? ORDER BY t.last_activity DESC LIMIT 1'
      ).get(b.id);

      return {
        id: b.id,
        name: b.name,
        description: b.description,
        position: b.position,
        locked: b.locked === 1,
        threadCount,
        postCount,
        lastActivity: lastThread ? {
          title: lastThread.title,
          author: lastThread.last_author,
          time: timeAgo(lastThread.last_activity),
        } : null,
      };
    });

    res.json(result);
  });

  // GET /api/forum/boards/:id — single board with threads
  app.get('/api/forum/boards/:id', (req, res) => {
    const { id } = req.params;
    const board = db.prepare('SELECT * FROM forum_boards WHERE id = ?').get(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const totalThreads = db.prepare(
      'SELECT COUNT(*) as count FROM forum_threads WHERE board_id = ?'
    ).get(id).count;

    const threads = db.prepare(
      `SELECT t.*, u.alias as author_alias, u.avatar_color as author_color
       FROM forum_threads t
       JOIN forum_users u ON u.id = t.author_id
       WHERE t.board_id = ?
       ORDER BY t.pinned DESC, t.last_activity DESC
       LIMIT ? OFFSET ?`
    ).all(id, limit, offset);

    res.json({
      board: {
        id: board.id,
        name: board.name,
        description: board.description,
        locked: board.locked === 1,
      },
      threads: threads.map(t => ({
        id: t.id,
        title: t.title,
        author: { alias: t.author_alias, color: t.author_color },
        pinned: t.pinned === 1,
        locked: t.locked === 1,
        replyCount: t.reply_count,
        lastActivity: timeAgo(t.last_activity),
        created: timeAgo(t.created_at),
      })),
      pagination: {
        page,
        totalPages: Math.ceil(totalThreads / limit) || 1,
        totalThreads,
      },
    });
  });

  // ============================================
  // THREAD ENDPOINTS
  // ============================================

  // POST /api/forum/boards/:id/threads — create new thread
  app.post('/api/forum/boards/:id/threads', requireAuth, (req, res) => {
    const { id } = req.params;
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'title and body are required' });
    }

    if (title.length > 200) {
      return res.status(400).json({ error: 'title must be under 200 characters' });
    }

    const board = db.prepare('SELECT * FROM forum_boards WHERE id = ?').get(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    if (board.locked === 1 && req.forumUser.role === 'user') {
      return res.status(403).json({ error: 'Board is locked' });
    }

    const threadId = `t_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const postId = `p_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const createThread = db.transaction(() => {
      db.prepare(
        'INSERT INTO forum_threads (id, board_id, title, author_id) VALUES (?, ?, ?, ?)'
      ).run(threadId, id, title, req.forumUser.id);

      db.prepare(
        'INSERT INTO forum_posts (id, thread_id, author_id, body) VALUES (?, ?, ?, ?)'
      ).run(postId, threadId, req.forumUser.id, body);
    });
    createThread();

    res.json({
      thread: {
        id: threadId,
        title,
        author: { alias: req.forumUser.alias, color: req.forumUser.avatarColor },
        pinned: false,
        locked: false,
        replyCount: 0,
        lastActivity: 'just now',
        created: 'just now',
      },
    });
  });

  // GET /api/forum/threads/:id — thread with posts
  app.get('/api/forum/threads/:id', (req, res) => {
    const { id } = req.params;

    const thread = db.prepare(
      `SELECT t.*, u.alias as author_alias, u.avatar_color as author_color
       FROM forum_threads t
       JOIN forum_users u ON u.id = t.author_id
       WHERE t.id = ?`
    ).get(id);

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 25;
    const offset = (page - 1) * limit;

    const totalPosts = db.prepare(
      'SELECT COUNT(*) as count FROM forum_posts WHERE thread_id = ?'
    ).get(id).count;

    const posts = db.prepare(
      `SELECT p.*, u.alias as author_alias, u.avatar_color as author_color, u.role as author_role
       FROM forum_posts p
       JOIN forum_users u ON u.id = p.author_id
       WHERE p.thread_id = ?
       ORDER BY p.created_at ASC
       LIMIT ? OFFSET ?`
    ).all(id, limit, offset);

    res.json({
      thread: {
        id: thread.id,
        boardId: thread.board_id,
        title: thread.title,
        author: { alias: thread.author_alias, color: thread.author_color },
        pinned: thread.pinned === 1,
        locked: thread.locked === 1,
        created: timeAgo(thread.created_at),
      },
      posts: posts.map(p => ({
        id: p.id,
        body: p.body,
        author: {
          id: p.author_id,
          alias: p.author_alias,
          color: p.author_color,
          role: p.author_role,
        },
        edited: p.edited === 1,
        created: timeAgo(p.created_at),
      })),
      pagination: {
        page,
        totalPages: Math.ceil(totalPosts / limit) || 1,
        totalPosts,
      },
    });
  });

  // POST /api/forum/threads/:id/posts — reply to thread
  app.post('/api/forum/threads/:id/posts', requireAuth, (req, res) => {
    const { id } = req.params;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

    const thread = db.prepare('SELECT * FROM forum_threads WHERE id = ?').get(id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    if (thread.locked === 1 && req.forumUser.role === 'user') {
      return res.status(403).json({ error: 'Thread is locked' });
    }

    const postId = `p_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const createPost = db.transaction(() => {
      db.prepare(
        'INSERT INTO forum_posts (id, thread_id, author_id, body) VALUES (?, ?, ?, ?)'
      ).run(postId, id, req.forumUser.id, body);

      db.prepare(
        'UPDATE forum_threads SET reply_count = reply_count + 1, last_activity = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(id);
    });
    createPost();

    res.json({
      post: {
        id: postId,
        body,
        author: {
          id: req.forumUser.id,
          alias: req.forumUser.alias,
          color: req.forumUser.avatarColor,
          role: req.forumUser.role,
        },
        edited: false,
        created: 'just now',
      },
    });
  });

  // PUT /api/forum/posts/:id — edit own post
  app.put('/api/forum/posts/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { body } = req.body;

    if (!body) {
      return res.status(400).json({ error: 'body is required' });
    }

    const post = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author_id !== req.forumUser.id && req.forumUser.role === 'user') {
      return res.status(403).json({ error: 'You can only edit your own posts' });
    }

    db.prepare('UPDATE forum_posts SET body = ?, edited = 1 WHERE id = ?').run(body, id);
    res.json({ success: true });
  });

  // DELETE /api/forum/posts/:id — delete own post (or admin)
  app.delete('/api/forum/posts/:id', requireAuth, (req, res) => {
    const { id } = req.params;

    const post = db.prepare('SELECT * FROM forum_posts WHERE id = ?').get(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.author_id !== req.forumUser.id && req.forumUser.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    db.prepare('DELETE FROM forum_posts WHERE id = ?').run(id);
    db.prepare(
      'UPDATE forum_threads SET reply_count = MAX(reply_count - 1, 0) WHERE id = ?'
    ).run(post.thread_id);

    res.json({ success: true });
  });

  // ============================================
  // ADMIN TOOL ENDPOINTS (board editing)
  // ============================================

  // PUT /api/forum/admin/boards/:id — edit board (name, description, lock)
  app.put('/api/forum/admin/boards/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, description, locked } = req.body;

    const board = db.prepare('SELECT * FROM forum_boards WHERE id = ?').get(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const newName = name !== undefined ? name : board.name;
    const newDesc = description !== undefined ? description : board.description;
    const newLocked = locked !== undefined ? (locked ? 1 : 0) : board.locked;

    db.prepare(
      'UPDATE forum_boards SET name = ?, description = ?, locked = ? WHERE id = ?'
    ).run(newName, newDesc, newLocked, id);

    res.json({
      board: {
        id,
        name: newName,
        description: newDesc,
        locked: newLocked === 1,
      },
    });
  });

  // PUT /api/forum/admin/boards/reorder — reorder boards
  app.put('/api/forum/admin/boards/reorder', requireAuth, requireAdmin, (req, res) => {
    const { order } = req.body; // array of board IDs in desired order

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'order must be an array of board IDs' });
    }

    const reorder = db.transaction(() => {
      order.forEach((boardId, index) => {
        db.prepare('UPDATE forum_boards SET position = ? WHERE id = ?').run(index, boardId);
      });
    });
    reorder();

    res.json({ success: true });
  });

  // POST /api/forum/admin/boards — create new board
  app.post('/api/forum/admin/boards', requireAuth, requireAdmin, (req, res) => {
    const { name, description } = req.body;

    const maxPos = db.prepare('SELECT MAX(position) as max FROM forum_boards').get().max || 0;
    const id = `board_${Date.now()}`;

    db.prepare(
      'INSERT INTO forum_boards (id, name, description, position) VALUES (?, ?, ?, ?)'
    ).run(id, name || '', description || '', maxPos + 1);

    res.json({
      board: { id, name: name || '', description: description || '', position: maxPos + 1, locked: false },
    });
  });

  // DELETE /api/forum/admin/boards/:id — delete board (and its threads/posts)
  app.delete('/api/forum/admin/boards/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;

    const board = db.prepare('SELECT * FROM forum_boards WHERE id = ?').get(id);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const deleteBoard = db.transaction(() => {
      // Delete posts in threads of this board
      db.prepare(
        'DELETE FROM forum_posts WHERE thread_id IN (SELECT id FROM forum_threads WHERE board_id = ?)'
      ).run(id);
      // Delete threads
      db.prepare('DELETE FROM forum_threads WHERE board_id = ?').run(id);
      // Delete board
      db.prepare('DELETE FROM forum_boards WHERE id = ?').run(id);
    });
    deleteBoard();

    res.json({ success: true });
  });

  // PUT /api/forum/admin/threads/:id — pin/lock/delete thread
  app.put('/api/forum/admin/threads/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { pinned, locked } = req.body;

    const thread = db.prepare('SELECT * FROM forum_threads WHERE id = ?').get(id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const newPinned = pinned !== undefined ? (pinned ? 1 : 0) : thread.pinned;
    const newLocked = locked !== undefined ? (locked ? 1 : 0) : thread.locked;

    db.prepare(
      'UPDATE forum_threads SET pinned = ?, locked = ? WHERE id = ?'
    ).run(newPinned, newLocked, id);

    res.json({ success: true, pinned: newPinned === 1, locked: newLocked === 1 });
  });

  // DELETE /api/forum/admin/threads/:id — delete thread and its posts
  app.delete('/api/forum/admin/threads/:id', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;

    const thread = db.prepare('SELECT * FROM forum_threads WHERE id = ?').get(id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const deleteThread = db.transaction(() => {
      db.prepare('DELETE FROM forum_posts WHERE thread_id = ?').run(id);
      db.prepare('DELETE FROM forum_threads WHERE id = ?').run(id);
    });
    deleteThread();

    res.json({ success: true });
  });

  // PUT /api/forum/admin/users/:id/role — change user role
  app.put('/api/forum/admin/users/:id/role', requireAuth, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'role must be user, moderator, or admin' });
    }

    const user = db.prepare('SELECT * FROM forum_users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('UPDATE forum_users SET role = ? WHERE id = ?').run(role, id);
    res.json({ success: true });
  });

  // ============================================
  // SERVE FORUM HTML
  // ============================================
  app.get('/forum', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
}

module.exports = { registerForumRoutes };

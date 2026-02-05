// ============================================
// FORUM API CLIENT
// ============================================
// Handles all communication with /api/forum/* endpoints.
// Token is stored in localStorage for session persistence.

const ForumAPI = (() => {
  const BASE = '/api/forum';
  const TOKEN_KEY = 'forum_token';
  const USER_KEY = 'forum_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['x-forum-token'] = token;

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  }

  return {
    getToken,
    getStoredUser,

    // Auth
    async register(alias, passphrase) {
      const data = await request('POST', '/register', { alias, passphrase });
      setSession(data.token, data.user);
      return data;
    },

    async login(alias, passphrase) {
      const data = await request('POST', '/login', { alias, passphrase });
      setSession(data.token, data.user);
      return data;
    },

    async logout() {
      try { await request('POST', '/logout'); } catch {}
      clearSession();
    },

    async me() {
      return request('GET', '/me');
    },

    // Boards
    async getBoards() {
      return request('GET', '/boards');
    },

    async getBoard(id, page) {
      return request('GET', `/boards/${id}?page=${page || 1}`);
    },

    // Threads
    async createThread(boardId, title, body) {
      return request('POST', `/boards/${boardId}/threads`, { title, body });
    },

    async getThread(id, page) {
      return request('GET', `/threads/${id}?page=${page || 1}`);
    },

    // Posts
    async createPost(threadId, body) {
      return request('POST', `/threads/${threadId}/posts`, { body });
    },

    async editPost(postId, body) {
      return request('PUT', `/posts/${postId}`, { body });
    },

    async deletePost(postId) {
      return request('DELETE', `/posts/${postId}`);
    },

    // Admin
    async editBoard(boardId, updates) {
      return request('PUT', `/admin/boards/${boardId}`, updates);
    },

    async reorderBoards(order) {
      return request('PUT', '/admin/boards/reorder', { order });
    },

    async createBoard(name, description) {
      return request('POST', '/admin/boards', { name, description });
    },

    async deleteBoard(boardId) {
      return request('DELETE', `/admin/boards/${boardId}`);
    },

    async editThread(threadId, updates) {
      return request('PUT', `/admin/threads/${threadId}`, updates);
    },

    async deleteThread(threadId) {
      return request('DELETE', `/admin/threads/${threadId}`);
    },

    async setUserRole(userId, role) {
      return request('PUT', `/admin/users/${userId}/role`, { role });
    },
  };
})();

// ============================================
// FORUM REACT APPLICATION
// ============================================
// Main SPA for the forum. Views: board list, board (threads), thread (posts).
// Admin tool panel for editing boards when logged in as admin.

const { useState, useEffect, useCallback } = React;

// ============================================
// NOTIFICATION COMPONENT
// ============================================
function Notification({ message, type, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return React.createElement('div', {
    className: `forum-notification ${type === 'error' ? 'forum-notification-error' : ''}`,
    onClick: onDismiss,
  }, message);
}

// ============================================
// AUTH MODAL
// ============================================
function AuthModal({ mode, onClose, onSuccess }) {
  const [alias, setAlias] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = mode === 'register'
        ? await ForumAPI.register(alias, passphrase)
        : await ForumAPI.login(alias, passphrase);
      onSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return React.createElement('div', { className: 'forum-modal-overlay', onClick: onClose },
    React.createElement('div', {
      className: 'forum-modal',
      onClick: e => e.stopPropagation(),
    },
      React.createElement('div', { className: 'forum-modal-title' },
        mode === 'register' ? 'Create Anonymous Account' : 'Sign In'
      ),

      mode === 'register' && React.createElement('p', {
        style: { fontSize: '12px', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: '1.6' }
      }, 'No email. No real name. Just pick an alias and a passphrase. That\'s it.'),

      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'forum-form-group' },
          React.createElement('label', { className: 'forum-form-label' }, 'Alias'),
          React.createElement('input', {
            className: 'forum-input',
            type: 'text',
            value: alias,
            onChange: e => setAlias(e.target.value),
            placeholder: 'your handle',
            autoFocus: true,
            maxLength: 30,
          })
        ),
        React.createElement('div', { className: 'forum-form-group' },
          React.createElement('label', { className: 'forum-form-label' }, 'Passphrase'),
          React.createElement('input', {
            className: 'forum-input',
            type: 'password',
            value: passphrase,
            onChange: e => setPassphrase(e.target.value),
            placeholder: mode === 'register' ? 'pick something memorable (6+ chars)' : 'your passphrase',
          })
        ),
        error && React.createElement('p', {
          style: { color: '#ff6666', fontSize: '12px', marginBottom: '12px' }
        }, error),
        React.createElement('div', { className: 'forum-modal-actions' },
          React.createElement('button', {
            type: 'button', className: 'btn', onClick: onClose
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit', className: 'btn btn-primary', disabled: loading
          }, loading ? '...' : (mode === 'register' ? 'Create Account' : 'Sign In'))
        )
      )
    )
  );
}

// ============================================
// ADMIN TOOL PANEL (Board Editor)
// ============================================
function AdminPanel({ boards, onBoardsChanged }) {
  const [editingBoards, setEditingBoards] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditingBoards(boards.map(b => ({ ...b })));
  }, [boards]);

  function updateField(idx, field, value) {
    setEditingBoards(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  async function saveAll() {
    setSaving(true);
    try {
      for (const b of editingBoards) {
        await ForumAPI.editBoard(b.id, {
          name: b.name,
          description: b.description,
          locked: b.locked,
        });
      }
      onBoardsChanged();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function addBoard() {
    try {
      await ForumAPI.createBoard('', '');
      onBoardsChanged();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  }

  async function removeBoard(id) {
    if (!confirm('Delete this board and ALL its threads/posts?')) return;
    try {
      await ForumAPI.deleteBoard(id);
      onBoardsChanged();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  }

  return React.createElement('div', { className: 'admin-panel' },
    React.createElement('div', { className: 'admin-panel-title' },
      '\u2699 Board Editor Tool'
    ),
    editingBoards.map((b, idx) =>
      React.createElement('div', { key: b.id, className: 'admin-board-row' },
        React.createElement('span', {
          style: { fontSize: '11px', color: 'var(--text-dimmer)', width: '20px' }
        }, idx + 1),
        React.createElement('input', {
          className: 'admin-board-input',
          value: b.name,
          onChange: e => updateField(idx, 'name', e.target.value),
          placeholder: 'Board name (leave empty for unnamed)',
        }),
        React.createElement('input', {
          className: 'admin-board-input',
          value: b.description,
          onChange: e => updateField(idx, 'description', e.target.value),
          placeholder: 'Description',
        }),
        React.createElement('label', {
          style: { fontSize: '11px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }
        },
          React.createElement('input', {
            type: 'checkbox',
            checked: b.locked,
            onChange: e => updateField(idx, 'locked', e.target.checked),
          }),
          'Lock'
        ),
        React.createElement('button', {
          className: 'btn btn-small btn-danger',
          onClick: () => removeBoard(b.id),
        }, 'X')
      )
    ),
    React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } },
      React.createElement('button', {
        className: 'btn btn-small btn-primary',
        onClick: saveAll,
        disabled: saving,
      }, saving ? 'Saving...' : 'Save All'),
      React.createElement('button', {
        className: 'btn btn-small',
        onClick: addBoard,
      }, '+ Add Board')
    )
  );
}

// ============================================
// THREAD ADMIN CONTROLS
// ============================================
function ThreadAdminControls({ thread, onChanged }) {
  async function togglePin() {
    try {
      await ForumAPI.editThread(thread.id, { pinned: !thread.pinned });
      onChanged();
    } catch (err) { alert(err.message); }
  }
  async function toggleLock() {
    try {
      await ForumAPI.editThread(thread.id, { locked: !thread.locked });
      onChanged();
    } catch (err) { alert(err.message); }
  }
  async function deleteThread() {
    if (!confirm('Delete this thread and all its posts?')) return;
    try {
      await ForumAPI.deleteThread(thread.id);
      onChanged('deleted');
    } catch (err) { alert(err.message); }
  }

  return React.createElement('div', {
    style: { display: 'flex', gap: '8px', marginLeft: 'auto' }
  },
    React.createElement('button', { className: 'btn btn-small', onClick: togglePin },
      thread.pinned ? 'Unpin' : 'Pin'
    ),
    React.createElement('button', { className: 'btn btn-small', onClick: toggleLock },
      thread.locked ? 'Unlock' : 'Lock'
    ),
    React.createElement('button', { className: 'btn btn-small btn-danger', onClick: deleteThread },
      'Delete'
    )
  );
}

// ============================================
// BOARD LIST VIEW
// ============================================
function BoardListView({ boards, onSelectBoard, user, onBoardsChanged }) {
  return React.createElement('div', null,
    user && user.role === 'admin' &&
      React.createElement(AdminPanel, { boards, onBoardsChanged }),

    React.createElement('div', { className: 'section-bar' },
      React.createElement('span', { className: 'section-title' }, 'Boards'),
    ),

    React.createElement('div', { className: 'column-header' },
      React.createElement('span', null, 'Board'),
      React.createElement('span', { style: { textAlign: 'center' } }, 'Threads'),
      React.createElement('span', { style: { textAlign: 'center' } }, 'Posts'),
      React.createElement('span', { style: { textAlign: 'right' } }, 'Last Activity')
    ),

    React.createElement('div', { className: 'board-list' },
      boards.map(b =>
        React.createElement('div', {
          key: b.id,
          className: 'board-card',
          onClick: () => onSelectBoard(b.id),
        },
          React.createElement('div', null,
            React.createElement('div', {
              className: b.name ? 'board-name' : 'board-name board-name-unnamed'
            },
              b.locked && React.createElement('span', { className: 'badge badge-locked' }, 'Locked'),
              b.name || 'Unnamed Board'
            ),
            b.description && React.createElement('div', { className: 'board-description' }, b.description)
          ),
          React.createElement('div', { className: 'board-stat' },
            React.createElement('span', { className: 'board-stat-value' }, b.threadCount),
          ),
          React.createElement('div', { className: 'board-stat' },
            React.createElement('span', { className: 'board-stat-value' }, b.postCount),
          ),
          React.createElement('div', { className: 'board-last-activity' },
            b.lastActivity
              ? React.createElement(React.Fragment, null,
                  React.createElement('div', { className: 'board-last-title' }, b.lastActivity.title),
                  React.createElement('div', null, b.lastActivity.author, ' \u00b7 ', b.lastActivity.time)
                )
              : React.createElement('span', { style: { color: 'var(--text-dimmer)' } }, 'No threads yet')
          )
        )
      )
    ),

    boards.length === 0 && React.createElement('div', { className: 'empty-state' },
      React.createElement('div', { className: 'empty-state-title' }, 'No boards configured'),
      React.createElement('p', null, 'An admin needs to set up the forum boards.')
    )
  );
}

// ============================================
// BOARD VIEW (Thread List)
// ============================================
function BoardView({ boardId, onBack, onSelectThread, user }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await ForumAPI.getBoard(boardId, page);
      setData(result);
    } catch (err) {
      console.error('Failed to load board:', err);
    }
  }, [boardId, page]);

  useEffect(() => { load(); }, [load]);

  async function handleNewThread(e) {
    e.preventDefault();
    if (!newTitle.trim() || !newBody.trim()) return;
    setPosting(true);
    try {
      await ForumAPI.createThread(boardId, newTitle.trim(), newBody.trim());
      setNewTitle('');
      setNewBody('');
      setShowNewThread(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setPosting(false);
    }
  }

  if (!data) {
    return React.createElement('div', { className: 'empty-state' }, 'Loading...');
  }

  const { board, threads, pagination } = data;

  return React.createElement('div', null,
    React.createElement('div', { className: 'breadcrumb' },
      React.createElement('span', { className: 'breadcrumb-link', onClick: onBack }, 'Boards'),
      React.createElement('span', { className: 'breadcrumb-sep' }, '/'),
      React.createElement('span', null, board.name || 'Unnamed Board')
    ),

    React.createElement('div', { className: 'section-bar' },
      React.createElement('span', { className: 'section-title' },
        board.name || 'Unnamed Board',
        board.locked && React.createElement('span', {
          className: 'badge badge-locked', style: { marginLeft: '8px' }
        }, 'Locked')
      ),
      user && !board.locked &&
        React.createElement('button', {
          className: 'btn btn-small btn-primary',
          onClick: () => setShowNewThread(true),
        }, '+ New Thread')
    ),

    board.description && React.createElement('p', {
      style: { fontSize: '12px', color: 'var(--text-dim)', marginBottom: '16px' }
    }, board.description),

    showNewThread && React.createElement('div', {
      style: { background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px', marginBottom: '16px' }
    },
      React.createElement('form', { onSubmit: handleNewThread },
        React.createElement('div', { className: 'forum-form-group' },
          React.createElement('label', { className: 'forum-form-label' }, 'Thread Title'),
          React.createElement('input', {
            className: 'forum-input',
            value: newTitle,
            onChange: e => setNewTitle(e.target.value),
            placeholder: 'Thread title',
            maxLength: 200,
            autoFocus: true,
          })
        ),
        React.createElement('div', { className: 'forum-form-group' },
          React.createElement('label', { className: 'forum-form-label' }, 'Opening Post'),
          React.createElement('textarea', {
            className: 'forum-textarea',
            value: newBody,
            onChange: e => setNewBody(e.target.value),
            placeholder: 'Write your post...',
          })
        ),
        React.createElement('div', { style: { display: 'flex', gap: '8px' } },
          React.createElement('button', {
            type: 'submit', className: 'btn btn-small btn-primary', disabled: posting
          }, posting ? 'Posting...' : 'Create Thread'),
          React.createElement('button', {
            type: 'button', className: 'btn btn-small',
            onClick: () => setShowNewThread(false)
          }, 'Cancel')
        )
      )
    ),

    React.createElement('div', {
      className: 'column-header thread-column-header'
    },
      React.createElement('span', null, 'Thread'),
      React.createElement('span', { style: { textAlign: 'center' } }, 'Replies'),
      React.createElement('span', { style: { textAlign: 'right' } }, 'Activity')
    ),

    React.createElement('div', { className: 'thread-list' },
      threads.map(t =>
        React.createElement('div', {
          key: t.id,
          className: 'thread-row',
          onClick: () => onSelectThread(t.id),
        },
          React.createElement('div', null,
            React.createElement('div', { className: 'thread-title' },
              t.pinned && React.createElement('span', { className: 'badge badge-pinned' }, 'Pinned'),
              t.locked && React.createElement('span', { className: 'badge badge-locked' }, 'Locked'),
              t.title
            ),
            React.createElement('div', { className: 'thread-meta' },
              React.createElement('span', { style: { color: t.author.color } }, t.author.alias),
              ' \u00b7 ', t.created
            )
          ),
          React.createElement('div', { className: 'thread-replies' }, t.replyCount),
          React.createElement('div', { className: 'thread-activity' }, t.lastActivity)
        )
      )
    ),

    threads.length === 0 && React.createElement('div', { className: 'empty-state' },
      React.createElement('div', { className: 'empty-state-title' }, 'No threads yet'),
      user
        ? React.createElement('p', null, 'Be the first to start a discussion.')
        : React.createElement('p', null, 'Sign in to start a thread.')
    ),

    pagination.totalPages > 1 && React.createElement('div', { className: 'pagination' },
      React.createElement('button', {
        className: 'btn btn-small',
        disabled: page <= 1,
        onClick: () => setPage(p => p - 1),
      }, 'Prev'),
      React.createElement('span', { className: 'pagination-info' },
        `Page ${pagination.page} of ${pagination.totalPages}`
      ),
      React.createElement('button', {
        className: 'btn btn-small',
        disabled: page >= pagination.totalPages,
        onClick: () => setPage(p => p + 1),
      }, 'Next')
    )
  );
}

// ============================================
// THREAD VIEW (Posts)
// ============================================
function ThreadView({ threadId, onBack, onBackToBoards, user }) {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [replyBody, setReplyBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');

  const load = useCallback(async () => {
    try {
      const result = await ForumAPI.getThread(threadId, page);
      setData(result);
    } catch (err) {
      console.error('Failed to load thread:', err);
    }
  }, [threadId, page]);

  useEffect(() => { load(); }, [load]);

  async function handleReply(e) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setPosting(true);
    try {
      await ForumAPI.createPost(threadId, replyBody.trim());
      setReplyBody('');
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setPosting(false);
    }
  }

  async function handleEdit(postId) {
    if (!editBody.trim()) return;
    try {
      await ForumAPI.editPost(postId, editBody.trim());
      setEditingId(null);
      setEditBody('');
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete(postId) {
    if (!confirm('Delete this post?')) return;
    try {
      await ForumAPI.deletePost(postId);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleAdminAction(action) {
    if (action === 'deleted') {
      onBack();
    } else {
      load();
    }
  }

  if (!data) {
    return React.createElement('div', { className: 'empty-state' }, 'Loading...');
  }

  const { thread, posts, pagination } = data;

  return React.createElement('div', null,
    React.createElement('div', { className: 'breadcrumb' },
      React.createElement('span', { className: 'breadcrumb-link', onClick: onBackToBoards }, 'Boards'),
      React.createElement('span', { className: 'breadcrumb-sep' }, '/'),
      React.createElement('span', { className: 'breadcrumb-link', onClick: onBack }, thread.boardId),
      React.createElement('span', { className: 'breadcrumb-sep' }, '/'),
      React.createElement('span', null, thread.title.substring(0, 40) + (thread.title.length > 40 ? '...' : ''))
    ),

    React.createElement('div', { className: 'section-bar' },
      React.createElement('div', null,
        React.createElement('span', { className: 'section-title', style: { fontSize: '15px', color: 'var(--white)' } },
          thread.pinned && React.createElement('span', { className: 'badge badge-pinned' }, 'Pinned'),
          thread.locked && React.createElement('span', { className: 'badge badge-locked' }, 'Locked'),
          thread.title
        ),
        React.createElement('div', { style: { fontSize: '11px', color: 'var(--text-dimmer)', marginTop: '4px' } },
          'by ', React.createElement('span', { style: { color: thread.author.color } }, thread.author.alias),
          ' \u00b7 ', thread.created
        )
      ),
      user && user.role === 'admin' &&
        React.createElement(ThreadAdminControls, { thread, onChanged: handleAdminAction })
    ),

    React.createElement('div', { className: 'post-list', style: { marginTop: '16px' } },
      posts.map(p =>
        React.createElement('div', { key: p.id, className: 'post-card' },
          React.createElement('div', { className: 'post-author' },
            React.createElement('div', {
              className: 'forum-avatar forum-avatar-large',
              style: { backgroundColor: p.author.color }
            }, p.author.alias.charAt(0).toUpperCase()),
            React.createElement('div', { className: 'post-author-name' }, p.author.alias),
            p.author.role !== 'user' && React.createElement('span', {
              className: `badge ${p.author.role === 'admin' ? 'badge-admin' : 'badge-mod'}`
            }, p.author.role)
          ),
          React.createElement('div', { className: 'post-body' },
            editingId === p.id
              ? React.createElement('div', null,
                  React.createElement('textarea', {
                    className: 'forum-textarea',
                    value: editBody,
                    onChange: e => setEditBody(e.target.value),
                  }),
                  React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '8px' } },
                    React.createElement('button', {
                      className: 'btn btn-small btn-primary',
                      onClick: () => handleEdit(p.id),
                    }, 'Save'),
                    React.createElement('button', {
                      className: 'btn btn-small',
                      onClick: () => setEditingId(null),
                    }, 'Cancel')
                  )
                )
              : React.createElement('div', { className: 'post-content' }, p.body),
            React.createElement('div', { className: 'post-footer' },
              React.createElement('span', null,
                p.created,
                p.edited && React.createElement('span', {
                  style: { marginLeft: '8px', fontStyle: 'italic' }
                }, '(edited)')
              ),
              user && editingId !== p.id && React.createElement('div', { className: 'post-actions' },
                (user.id === p.author.id || user.role === 'admin') &&
                  React.createElement('button', {
                    className: 'post-action-btn',
                    onClick: () => { setEditingId(p.id); setEditBody(p.body); }
                  }, 'edit'),
                (user.id === p.author.id || user.role === 'admin') &&
                  React.createElement('button', {
                    className: 'post-action-btn',
                    onClick: () => handleDelete(p.id),
                  }, 'delete')
              )
            )
          )
        )
      )
    ),

    pagination.totalPages > 1 && React.createElement('div', { className: 'pagination' },
      React.createElement('button', {
        className: 'btn btn-small',
        disabled: page <= 1,
        onClick: () => setPage(p => p - 1),
      }, 'Prev'),
      React.createElement('span', { className: 'pagination-info' },
        `Page ${pagination.page} of ${pagination.totalPages}`
      ),
      React.createElement('button', {
        className: 'btn btn-small',
        disabled: page >= pagination.totalPages,
        onClick: () => setPage(p => p + 1),
      }, 'Next')
    ),

    user && !thread.locked && React.createElement('div', {
      style: { marginTop: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px' }
    },
      React.createElement('form', { onSubmit: handleReply },
        React.createElement('div', { className: 'forum-form-group' },
          React.createElement('label', { className: 'forum-form-label' }, 'Reply'),
          React.createElement('textarea', {
            className: 'forum-textarea',
            value: replyBody,
            onChange: e => setReplyBody(e.target.value),
            placeholder: 'Write your reply...',
          })
        ),
        React.createElement('button', {
          type: 'submit', className: 'btn btn-small btn-primary', disabled: posting
        }, posting ? 'Posting...' : 'Post Reply')
      )
    ),

    !user && React.createElement('div', {
      style: { textAlign: 'center', padding: '20px', color: 'var(--text-dimmer)', fontSize: '12px' }
    }, 'Sign in to reply to this thread.')
  );
}

// ============================================
// MAIN FORUM APP
// ============================================
function ForumApp() {
  const [user, setUser] = useState(ForumAPI.getStoredUser());
  const [boards, setBoards] = useState([]);
  const [view, setView] = useState('boards');          // boards | board | thread
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [authModal, setAuthModal] = useState(null);    // null | 'login' | 'register'
  const [notification, setNotification] = useState(null);

  const loadBoards = useCallback(async () => {
    try {
      const data = await ForumAPI.getBoards();
      setBoards(data);
    } catch (err) {
      console.error('Failed to load boards:', err);
    }
  }, []);

  useEffect(() => { loadBoards(); }, [loadBoards]);

  // Verify stored session on mount
  useEffect(() => {
    if (ForumAPI.getToken()) {
      ForumAPI.me().then(data => setUser(data.user)).catch(() => {
        ForumAPI.logout();
        setUser(null);
      });
    }
  }, []);

  function notify(message, type) {
    setNotification({ message, type, key: Date.now() });
  }

  function handleSelectBoard(id) {
    setSelectedBoardId(id);
    setView('board');
  }

  function handleSelectThread(id) {
    setSelectedThreadId(id);
    setView('thread');
  }

  function handleBackToBoards() {
    setView('boards');
    setSelectedBoardId(null);
    setSelectedThreadId(null);
    loadBoards();
  }

  function handleBackToBoard() {
    setView('board');
    setSelectedThreadId(null);
  }

  async function handleLogout() {
    await ForumAPI.logout();
    setUser(null);
    notify('Signed out', 'info');
  }

  function handleAuthSuccess(u) {
    setUser(u);
    setAuthModal(null);
    notify(`Welcome, ${u.alias}`, 'info');
  }

  return React.createElement('div', { className: 'forum-container' },
    // Notification
    notification && React.createElement(Notification, {
      key: notification.key,
      message: notification.message,
      type: notification.type,
      onDismiss: () => setNotification(null),
    }),

    // Auth Modal
    authModal && React.createElement(AuthModal, {
      mode: authModal,
      onClose: () => setAuthModal(null),
      onSuccess: handleAuthSuccess,
    }),

    // Header
    React.createElement('header', { className: 'forum-header' },
      React.createElement('div', null,
        React.createElement('div', { className: 'forum-header-title' },
          'SOLIDARITY', React.createElement('span', { className: 'accent' }, '_'), 'FORUM'
        ),
        React.createElement('p', {
          style: { fontSize: '11px', color: 'var(--text-dimmer)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '2px' }
        }, 'Anonymous Discussion')
      ),
      React.createElement('div', { className: 'forum-auth-bar' },
        user
          ? React.createElement(React.Fragment, null,
              React.createElement('div', { className: 'forum-auth-user' },
                React.createElement('div', {
                  className: 'forum-avatar',
                  style: { backgroundColor: user.avatarColor }
                }, user.alias.charAt(0).toUpperCase()),
                React.createElement('span', null, user.alias),
                user.role !== 'user' && React.createElement('span', {
                  className: `badge ${user.role === 'admin' ? 'badge-admin' : 'badge-mod'}`
                }, user.role)
              ),
              React.createElement('button', {
                className: 'btn btn-small', onClick: handleLogout
              }, 'Sign Out')
            )
          : React.createElement(React.Fragment, null,
              React.createElement('button', {
                className: 'btn btn-small', onClick: () => setAuthModal('login')
              }, 'Sign In'),
              React.createElement('button', {
                className: 'btn btn-small btn-primary', onClick: () => setAuthModal('register')
              }, 'Create Account')
            ),
        React.createElement('a', { href: '/' },
          React.createElement('button', { className: 'forum-header-back' }, 'Main Site')
        )
      )
    ),

    // Main content
    view === 'boards' && React.createElement(BoardListView, {
      boards,
      onSelectBoard: handleSelectBoard,
      user,
      onBoardsChanged: loadBoards,
    }),

    view === 'board' && React.createElement(BoardView, {
      boardId: selectedBoardId,
      onBack: handleBackToBoards,
      onSelectThread: handleSelectThread,
      user,
    }),

    view === 'thread' && React.createElement(ThreadView, {
      threadId: selectedThreadId,
      onBack: handleBackToBoard,
      onBackToBoards: handleBackToBoards,
      user,
    }),

    // Footer
    React.createElement('footer', { className: 'forum-footer' },
      'SOLIDARITY_NET Forum \u00b7 No data collected \u00b7 No tracking \u00b7 ',
      React.createElement('a', { href: '/' }, 'Back to main site')
    )
  );
}

// Mount
ReactDOM.createRoot(document.getElementById('forum-root')).render(
  React.createElement(ForumApp)
);

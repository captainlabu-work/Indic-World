import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleService, userService } from '../firebase/services';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatRelativeTime } from '../utils/formatters';
import { useNotification } from '../components/common/NotificationSystem';
import './Admin.css';

const Admin = () => {
  const navigate = useNavigate();
  const { success, error: showError, showConfirmation } = useNotification();
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingArticles, setPendingArticles] = useState([]);
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [rejectedArticles, setRejectedArticles] = useState([]);
  const [archivedArticles, setArchivedArticles] = useState([]);
  const [deletedArticles, setDeletedArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArticles: 0,
    pendingCount: 0,
    publishedCount: 0,
    rejectedCount: 0,
    archivedCount: 0,
    deletedCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionArticle, setActionArticle] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    setLoading(true);

    const unsubscribePending = onSnapshot(
      query(collection(db, 'articles'), where('status', '==', 'pending'), orderBy('createdAt', 'desc')),
      (snapshot) => setPendingArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (error) => console.error('Error fetching pending articles:', error)
    );

    const unsubscribePublished = onSnapshot(
      query(collection(db, 'articles'), where('status', '==', 'published'), orderBy('createdAt', 'desc')),
      (snapshot) => setPublishedArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (error) => console.error('Error fetching published articles:', error)
    );

    const unsubscribeRejected = onSnapshot(
      query(collection(db, 'articles'), where('status', '==', 'rejected'), orderBy('createdAt', 'desc')),
      (snapshot) => setRejectedArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (error) => console.error('Error fetching rejected articles:', error)
    );

    const unsubscribeArchived = onSnapshot(
      query(collection(db, 'articles'), where('status', '==', 'archived')),
      (snapshot) => setArchivedArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (error) => console.error('Error fetching archived articles:', error)
    );

    const unsubscribeDeleted = onSnapshot(
      query(collection(db, 'articles'), where('status', '==', 'deleted')),
      (snapshot) => setDeletedArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (error) => console.error('Error fetching deleted articles:', error)
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const uniqueUsers = usersData.reduce((acc, current) => {
          if (!acc.find(u => u.email === current.email)) acc.push(current);
          return acc;
        }, []);
        setUsers(uniqueUsers);
        setStats(prev => ({ ...prev, totalUsers: uniqueUsers.length }));
      },
      (error) => console.error('Error fetching users:', error)
    );

    const unsubscribeStats = onSnapshot(
      collection(db, 'articles'),
      (snapshot) => {
        const articles = snapshot.docs.map(doc => doc.data());
        setStats(prev => ({
          ...prev,
          totalArticles: articles.length,
          pendingCount: articles.filter(a => a.status === 'pending').length,
          publishedCount: articles.filter(a => a.status === 'published').length,
          rejectedCount: articles.filter(a => a.status === 'rejected').length,
          archivedCount: articles.filter(a => a.status === 'archived').length,
          deletedCount: articles.filter(a => a.status === 'deleted').length
        }));
        setLoading(false);
      },
      (error) => { console.error('Error fetching stats:', error); setLoading(false); }
    );

    return () => {
      unsubscribePending(); unsubscribePublished(); unsubscribeRejected();
      unsubscribeArchived(); unsubscribeDeleted(); unsubscribeUsers(); unsubscribeStats();
    };
  }, []);

  // === Action handlers ===
  const handleApprove = async (articleId, e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await articleService.approveArticle(articleId);
      setActionArticle(null);
      success('Article approved and published!');
    } catch (err) {
      showError('Failed to approve article');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async (articleId) => {
    if (!rejectionReason.trim()) { showError('Please provide feedback'); return; }
    setActionLoading(true);
    try {
      await articleService.requestChanges(articleId, rejectionReason);
      setActionArticle(null);
      setRejectionReason('');
      success('Sent back for revision');
    } catch (err) {
      showError('Failed to request changes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (articleId) => {
    if (!rejectionReason.trim()) { showError('Please provide a reason'); return; }
    const confirmed = await showConfirmation({
      title: 'Reject Permanently?',
      message: 'This cannot be undone.',
      confirmText: 'Reject', cancelText: 'Cancel', type: 'danger'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await articleService.rejectArticle(articleId, rejectionReason);
      setActionArticle(null);
      setRejectionReason('');
      success('Article rejected');
    } catch (err) {
      showError('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async (articleId, e) => {
    e.stopPropagation();
    const confirmed = await showConfirmation({
      title: 'Unpublish?', message: 'It will return to draft status.',
      confirmText: 'Unpublish', cancelText: 'Cancel', type: 'warning'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await articleService.updateArticleStatus(articleId, 'draft');
      success('Article unpublished');
    } catch (err) {
      showError('Failed to unpublish');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (articleId, e) => {
    e.stopPropagation();
    const confirmed = await showConfirmation({
      title: 'Restore?', message: 'Restore to draft status?',
      confirmText: 'Restore', cancelText: 'Cancel'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await articleService.restoreArticle(articleId, 'draft');
      success('Article restored!');
    } catch (err) {
      showError('Failed to restore');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async (articleId, e) => {
    e.stopPropagation();
    const confirmed = await showConfirmation({
      title: 'Delete Forever?', message: 'This cannot be undone.',
      confirmText: 'Delete Forever', cancelText: 'Cancel', type: 'danger'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await articleService.permanentlyDeleteArticle(articleId);
      success('Permanently deleted');
    } catch (err) {
      showError('Failed to delete');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnarchive = async (articleId, e) => {
    e.stopPropagation();
    try {
      await articleService.unarchiveArticle(articleId, 'draft');
      success('Article unarchived');
    } catch (err) {
      showError('Failed to unarchive');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await userService.updateUserRole(userId, newRole);
      setEditingUserId(null);
      setSelectedRole('');
      success('Role updated!');
    } catch (err) {
      showError('Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const filterArticles = (articles) => {
    if (!searchTerm) return articles;
    return articles.filter(a =>
      a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'word': return 'WORD';
      case 'lens': return 'LENS';
      case 'motion': return 'MOTION';
      default: return 'WORD';
    }
  };

  // === Story Card (Magnum-style) ===
  const renderStoryCard = (article) => (
    <div key={article.id} className="admin-story-card" onClick={() => navigate(`/article/${article.id}`)}>
      <div className="admin-card-image">
        <img
          src={article.featuredImage || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2028'}
          alt={article.title}
          loading="lazy"
        />
        <span className={`admin-card-status status-${article.status}${article.isRevised ? ' revised' : ''}`}>
          {article.status === 'pending' && article.isRevised ? 'Revised' : article.status}
        </span>
      </div>
      <div className="admin-card-body">
        <span className="admin-card-tag">{article.tags?.[0] || getCategoryLabel(article.category)}</span>
        <h3 className="admin-card-title">{article.title}</h3>
        <span className="admin-card-author">{article.authorName}</span>
        <span className="admin-card-time">{formatRelativeTime(article.createdAt)}</span>
      </div>
      <div className="admin-card-actions">
        {article.status === 'pending' && (
          <>
            <button className="ac-btn ac-approve" onClick={(e) => handleApprove(article.id, e)} disabled={actionLoading}>Approve</button>
            <button className="ac-btn ac-feedback" onClick={(e) => { e.stopPropagation(); setActionArticle(article.id); }} disabled={actionLoading}>Feedback</button>
          </>
        )}
        {article.status === 'published' && (
          <button className="ac-btn ac-unpublish" onClick={(e) => handleUnpublish(article.id, e)} disabled={actionLoading}>Unpublish</button>
        )}
        {article.status === 'archived' && (
          <button className="ac-btn ac-restore" onClick={(e) => handleUnarchive(article.id, e)} disabled={actionLoading}>Unarchive</button>
        )}
        {article.status === 'deleted' && (
          <>
            <button className="ac-btn ac-restore" onClick={(e) => handleRestore(article.id, e)} disabled={actionLoading}>Restore</button>
            <button className="ac-btn ac-delete" onClick={(e) => handlePermanentDelete(article.id, e)} disabled={actionLoading}>Delete</button>
          </>
        )}
      </div>
    </div>
  );

  const renderArticleGrid = (articles, emptyIcon, emptyTitle, emptyMsg) => {
    const filtered = filterArticles(articles);
    if (filtered.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">{emptyIcon}</div>
          <h3>{emptyTitle}</h3>
          <p>{emptyMsg}</p>
        </div>
      );
    }
    return (
      <div className="admin-story-grid">
        {filtered.map(article => renderStoryCard(article))}
      </div>
    );
  };

  if (loading) {
    return <div className="admin-container"><div className="loading-state">Loading admin panel...</div></div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">Manage content, users, and site analytics</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card"><div className="stat-number">{stats.pendingCount}</div><div className="stat-label">Pending Review</div></div>
        <div className="admin-stat-card"><div className="stat-number">{stats.publishedCount}</div><div className="stat-label">Published</div></div>
        <div className="admin-stat-card"><div className="stat-number">{stats.rejectedCount}</div><div className="stat-label">Rejected</div></div>
        <div className="admin-stat-card"><div className="stat-number">{stats.totalUsers}</div><div className="stat-label">Total Users</div></div>
      </div>

      <div className="admin-tabs">
        {[
          ['pending', `Pending Review (${pendingArticles.length})`],
          ['published', `Published (${publishedArticles.length})`],
          ['rejected', `Rejected (${rejectedArticles.length})`],
          ['archived', `Archived (${archivedArticles.length})`],
          ['deleted', `Deleted (${deletedArticles.length})`],
          ['users', `Users (${users.length})`],
        ].map(([key, label]) => (
          <button key={key} className={`admin-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {activeTab !== 'users' && (
        <div className="search-bar">
          <input type="text" placeholder="Search articles by title or author..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
        </div>
      )}

      {/* Feedback modal overlay */}
      {actionArticle && (
        <div className="admin-modal-overlay" onClick={() => { setActionArticle(null); setRejectionReason(''); }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Provide Feedback</h3>
            <textarea
              placeholder="Write feedback for the author..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="admin-modal-textarea"
            />
            <div className="admin-modal-actions">
              <button className="ac-btn ac-feedback" onClick={() => handleRequestChanges(actionArticle)} disabled={actionLoading}>
                {actionLoading ? 'Sending...' : 'Request Changes'}
              </button>
              <button className="ac-btn ac-delete" onClick={() => handleReject(actionArticle)} disabled={actionLoading}>
                {actionLoading ? 'Rejecting...' : 'Reject Permanently'}
              </button>
              <button className="ac-btn ac-cancel" onClick={() => { setActionArticle(null); setRejectionReason(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-content">
        {activeTab === 'pending' && renderArticleGrid(pendingArticles, '✅', 'All caught up!', 'No articles pending review')}
        {activeTab === 'published' && renderArticleGrid(publishedArticles, '📝', 'No published articles', 'Published articles will appear here')}
        {activeTab === 'rejected' && renderArticleGrid(rejectedArticles, '📋', 'No rejected articles', 'Rejected articles will appear here')}
        {activeTab === 'archived' && renderArticleGrid(archivedArticles, '📦', 'No archived articles', 'Archived articles will appear here')}
        {activeTab === 'deleted' && renderArticleGrid(deletedArticles, '🗑️', 'No deleted articles', 'Deleted articles will appear here')}

        {activeTab === 'users' && (
          <div className="users-list">
            {users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No users yet</h3>
                <p>Registered users will appear here</p>
              </div>
            ) : (
              <div className="users-grid">
                {users.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-avatar">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || user.email} className="avatar-img" />
                      ) : (
                        user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="user-info">
                      <h4 className="user-name">{user.displayName || 'No name'}</h4>
                      <p className="user-email">{user.email}</p>
                      {editingUserId === user.id ? (
                        <div className="role-editor">
                          <select value={selectedRole || user.role || 'author'} onChange={(e) => setSelectedRole(e.target.value)} className="role-select">
                            <option value="author">Author</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <div className="role-actions">
                            <button onClick={() => handleRoleChange(user.id, selectedRole || user.role)} className="save-role-btn" disabled={actionLoading}>
                              {actionLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => { setEditingUserId(null); setSelectedRole(''); }} className="cancel-role-btn">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="role-display">
                          <span className={`user-role ${user.role}`}>{user.role || 'author'}</span>
                          <button onClick={() => { setEditingUserId(user.id); setSelectedRole(user.role || 'author'); }} className="edit-role-btn">Change Role</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

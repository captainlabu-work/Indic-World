import { useState, useEffect } from 'react';
import { articleService, userService } from '../firebase/services';
import { collection, getDocs, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatTimestamp, formatRelativeTime, parseMarkdownToHtml } from '../utils/formatters';
import { useNotification } from '../components/common/NotificationSystem';
import './Admin.css';

const Admin = () => {
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
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    setLoading(true);

    // Real-time listener for pending articles
    const unsubscribePending = onSnapshot(
      query(
        collection(db, 'articles'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const articles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPendingArticles(articles);
      },
      (error) => {
        console.error('Error fetching pending articles:', error);
      }
    );

    // Real-time listener for published articles
    const unsubscribePublished = onSnapshot(
      query(
        collection(db, 'articles'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const articles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPublishedArticles(articles);
      },
      (error) => {
        console.error('Error fetching published articles:', error);
      }
    );

    // Real-time listener for rejected articles
    const unsubscribeRejected = onSnapshot(
      query(
        collection(db, 'articles'),
        where('status', '==', 'rejected'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const articles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRejectedArticles(articles);
      },
      (error) => {
        console.error('Error fetching rejected articles:', error);
      }
    );

    // Real-time listener for archived articles
    const unsubscribeArchived = onSnapshot(
      query(
        collection(db, 'articles'),
        where('status', '==', 'archived')
      ),
      (snapshot) => {
        const articles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setArchivedArticles(articles);
      },
      (error) => {
        console.error('Error fetching archived articles:', error);
      }
    );

    // Real-time listener for deleted articles
    const unsubscribeDeleted = onSnapshot(
      query(
        collection(db, 'articles'),
        where('status', '==', 'deleted')
      ),
      (snapshot) => {
        const articles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDeletedArticles(articles);
      },
      (error) => {
        console.error('Error fetching deleted articles:', error);
      }
    );

    // Real-time listener for users
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Remove duplicates based on email
        const uniqueUsers = usersData.reduce((acc, current) => {
          const existingUser = acc.find(user => user.email === current.email);
          if (!existingUser) {
            acc.push(current);
          } else {
            console.log('Duplicate user found:', current.email);
          }
          return acc;
        }, []);

        console.log('Total users in DB:', usersData.length);
        console.log('Unique users:', uniqueUsers.length);

        setUsers(uniqueUsers);
        // Update user count in stats
        setStats(prev => ({
          ...prev,
          totalUsers: uniqueUsers.length
        }));
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );

    // Real-time listener for stats
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
      (error) => {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    );

    // Cleanup all listeners on unmount
    return () => {
      unsubscribePending();
      unsubscribePublished();
      unsubscribeRejected();
      unsubscribeArchived();
      unsubscribeDeleted();
      unsubscribeUsers();
      unsubscribeStats();
    };
  }, []);

  const handleApprove = async (articleId) => {
    setActionLoading(true);
    try {
      await articleService.approveArticle(articleId);
      setSelectedArticle(null);
      success('Article approved and published successfully!');
    } catch (error) {
      console.error('Error approving article:', error);
      showError('Failed to approve article');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestChanges = async (articleId) => {
    if (!rejectionReason.trim()) {
      showError('Please provide feedback for the author');
      return;
    }

    setActionLoading(true);
    try {
      await articleService.requestChanges(articleId, rejectionReason);
      setSelectedArticle(null);
      setRejectionReason('');
      success('Article sent back for revision with your feedback');
    } catch (error) {
      console.error('Error requesting changes:', error);
      showError('Failed to request changes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (articleId) => {
    if (!rejectionReason.trim()) {
      showError('Please provide a reason for rejection');
      return;
    }

    const confirmed = await showConfirmation({
      title: 'Reject Article Permanently?',
      message: 'Are you sure you want to permanently reject this article? This action cannot be undone.',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    try {
      await articleService.rejectArticle(articleId, rejectionReason);
      setSelectedArticle(null);
      setRejectionReason('');
      success('Article rejected permanently');
    } catch (error) {
      console.error('Error rejecting article:', error);
      showError('Failed to reject article');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async (articleId) => {
    const confirmed = await showConfirmation({
      title: 'Unpublish Article?',
      message: 'Are you sure you want to unpublish this article? It will return to draft status.',
      confirmText: 'Unpublish',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (confirmed) {
      setActionLoading(true);
      try {
        await articleService.updateArticleStatus(articleId, 'draft');
        success('Article unpublished successfully');
      } catch (error) {
        console.error('Error unpublishing article:', error);
        showError('Failed to unpublish article');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRestoreArticle = async (articleId) => {
    const confirmed = await showConfirmation({
      title: 'Restore Article?',
      message: 'Are you sure you want to restore this article to draft status?',
      confirmText: 'Restore',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      setActionLoading(true);
      try {
        await articleService.restoreArticle(articleId, 'draft');
        success('Article restored successfully!');
      } catch (error) {
        console.error('Error restoring article:', error);
        showError('Failed to restore article');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handlePermanentDelete = async (articleId) => {
    const confirmed = await showConfirmation({
      title: 'Permanently Delete Article?',
      message: 'This action cannot be undone. The article will be permanently removed from the database.',
      confirmText: 'Delete Forever',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      setActionLoading(true);
      try {
        await articleService.permanentlyDeleteArticle(articleId);
        success('Article permanently deleted');
      } catch (error) {
        console.error('Error permanently deleting article:', error);
        showError('Failed to permanently delete article');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await userService.updateUserRole(userId, newRole);
      setEditingUserId(null);
      setSelectedRole('');
      success('User role updated successfully!');
    } catch (error) {
      console.error('Error updating user role:', error);
      showError('Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const filterArticles = (articles) => {
    if (!searchTerm) return articles;
    return articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderArticleCard = (article, showActions = true) => (
    <div key={article.id} className="pending-article-card">
      <div className="article-info">
        <h3 className="article-title">{article.title}</h3>
        <p className="article-excerpt">{article.excerpt}</p>
        <div className="article-meta">
          <span className="meta-item">By: {article.authorName}</span>
          <span className="meta-item" title={formatTimestamp(article.createdAt, true)}>
            {formatRelativeTime(article.createdAt)}
          </span>
          {article.updatedAt && article.updatedAt !== article.createdAt && (
            <span className="meta-item updated" title={formatTimestamp(article.updatedAt, true)}>
              Updated: {formatRelativeTime(article.updatedAt)}
            </span>
          )}
          <span className={`status-badge status-${article.status}${article.isRevised ? ' revised' : ''}`}>
            {article.status === 'pending' && article.isRevised ? 'Revised - Pending Review' : article.status}
          </span>
          {article.isRevised && (
            <span className="revised-indicator">✓ Revised</span>
          )}
        </div>
      </div>

      {selectedArticle === article.id ? (
        <div className="review-panel">
          <div className="article-full-content">
            <h4>Full Content:</h4>
            <div className="content-preview">{article.content}</div>
            {article.featuredImage && (
              <img src={article.featuredImage} alt={article.title} className="featured-image" />
            )}
          </div>

          {showActions && (
            <div className="review-actions">
              {article.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleApprove(article.id)}
                    className="approve-btn"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Approve & Publish'}
                  </button>

                  <div className="reject-section">
                    <textarea
                      placeholder="Provide feedback for the author..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="rejection-input"
                    />
                    <div className="admin-action-buttons">
                      <button
                        onClick={() => handleRequestChanges(article.id)}
                        className="request-changes-btn"
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Request Changes'}
                      </button>
                      <button
                        onClick={() => handleReject(article.id)}
                        className="reject-btn"
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Reject Permanently'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {article.status === 'published' && (
                <button
                  onClick={() => handleUnpublish(article.id)}
                  className="unpublish-btn"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Unpublish'}
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedArticle(null);
                  setRejectionReason('');
                }}
                className="cancel-btn"
              >
                Close
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="article-actions">
          <button
            onClick={() => setSelectedArticle(article.id)}
            className="review-btn"
          >
            {article.status === 'pending' ? 'Review Article' : 'View Details'}
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">Manage content, users, and site analytics</p>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <div className="stat-number">{stats.pendingCount}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-number">{stats.publishedCount}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-number">{stats.rejectedCount}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-number">{stats.totalUsers}</div>
          <div className="stat-label">Total Users</div>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Review ({pendingArticles.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'published' ? 'active' : ''}`}
          onClick={() => setActiveTab('published')}
        >
          Published ({publishedArticles.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected ({rejectedArticles.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'archived' ? 'active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          Archived ({archivedArticles.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'deleted' ? 'active' : ''}`}
          onClick={() => setActiveTab('deleted')}
        >
          Deleted ({deletedArticles.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
      </div>

      {activeTab !== 'users' && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search articles by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      <div className="admin-content">
        {activeTab === 'pending' && (
          filterArticles(pendingArticles).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>All caught up!</h3>
              <p>No articles pending review at the moment</p>
            </div>
          ) : (
            <div className="pending-articles">
              {filterArticles(pendingArticles).map(article => renderArticleCard(article))}
            </div>
          )
        )}

        {activeTab === 'published' && (
          filterArticles(publishedArticles).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No published articles</h3>
              <p>Published articles will appear here</p>
            </div>
          ) : (
            <div className="pending-articles">
              {filterArticles(publishedArticles).map(article => renderArticleCard(article))}
            </div>
          )
        )}

        {activeTab === 'rejected' && (
          filterArticles(rejectedArticles).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No rejected articles</h3>
              <p>Rejected articles will appear here</p>
            </div>
          ) : (
            <div className="pending-articles">
              {filterArticles(rejectedArticles).map(article => renderArticleCard(article, false))}
            </div>
          )
        )}

        {activeTab === 'archived' && (
          filterArticles(archivedArticles).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>No archived articles</h3>
              <p>Archived articles will appear here</p>
            </div>
          ) : (
            <div className="pending-articles">
              {filterArticles(archivedArticles).map(article => (
                <div key={article.id} className="pending-article-card">
                  <div className="article-info">
                    <h3 className="article-title">{article.title}</h3>
                    <p className="article-excerpt">{article.excerpt}</p>
                    <div className="article-meta">
                      <span className="meta-item">By: {article.authorName}</span>
                      <span className="meta-item" title={formatTimestamp(article.archivedAt, true)}>
                        Archived: {formatRelativeTime(article.archivedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="article-actions">
                    <button
                      onClick={() => articleService.unarchiveArticle(article.id, 'draft').then(() => {
                        success('Article unarchived successfully');
                      })}
                      className="action-btn restore"
                      disabled={actionLoading}
                    >
                      Unarchive
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'deleted' && (
          filterArticles(deletedArticles).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🗑️</div>
              <h3>No deleted articles</h3>
              <p>Deleted articles will appear here</p>
            </div>
          ) : (
            <div className="pending-articles">
              {filterArticles(deletedArticles).map(article => (
                <div key={article.id} className="pending-article-card">
                  <div className="article-info">
                    <h3 className="article-title">{article.title}</h3>
                    <p className="article-excerpt">{article.excerpt}</p>
                    <div className="article-meta">
                      <span className="meta-item">By: {article.authorName}</span>
                      <span className="meta-item" title={formatTimestamp(article.deletedAt, true)}>
                        Deleted: {formatRelativeTime(article.deletedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="article-actions">
                    <button
                      onClick={() => handleRestoreArticle(article.id)}
                      className="action-btn restore"
                      disabled={actionLoading}
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(article.id)}
                      className="action-btn delete"
                      disabled={actionLoading}
                    >
                      Delete Forever
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

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
                          <select
                            value={selectedRole || user.role || 'author'}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="role-select"
                          >
                            <option value="author">Author</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <div className="role-actions">
                            <button
                              onClick={() => handleRoleChange(user.id, selectedRole || user.role)}
                              className="save-role-btn"
                              disabled={actionLoading}
                            >
                              {actionLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                setSelectedRole('');
                              }}
                              className="cancel-role-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="role-display">
                          <span className={`user-role ${user.role}`}>{user.role || 'author'}</span>
                          <button
                            onClick={() => {
                              setEditingUserId(user.id);
                              setSelectedRole(user.role || 'author');
                            }}
                            className="edit-role-btn"
                          >
                            Change Role
                          </button>
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

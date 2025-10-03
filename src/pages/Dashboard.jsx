import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService } from '../firebase/services';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatTimestamp, formatRelativeTime } from '../utils/formatters';
import { useNotification } from '../components/common/NotificationSystem';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
  const { showConfirmation, success, error } = useNotification();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    pending: 0,
    draft: 0,
    rejected: 0
  });

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for user's articles
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'articles'),
        where('authorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const userArticles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filter out deleted and archived articles
        const activeArticles = userArticles.filter(a =>
          a.status !== 'deleted' && a.status !== 'archived'
        );

        setArticles(activeArticles);

        // Calculate stats in real-time (only for active articles)
        const statsData = {
          total: activeArticles.length,
          published: activeArticles.filter(a => a.status === 'published').length,
          pending: activeArticles.filter(a => a.status === 'pending').length,
          draft: activeArticles.filter(a => a.status === 'draft').length,
          rejected: activeArticles.filter(a => a.status === 'rejected').length
        };
        setStats(statsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching articles:', error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  const getStatusBadge = (status) => {
    const badges = {
      published: 'status-badge published',
      pending: 'status-badge pending',
      draft: 'status-badge draft',
      'needs-revision': 'status-badge needs-revision',
      rejected: 'status-badge rejected'
    };
    return badges[status] || 'status-badge';
  };

  const getStatusLabel = (status, isRevised) => {
    if (status === 'pending' && isRevised) {
      return 'Revised - Pending Review';
    }
    const labels = {
      published: 'Published',
      pending: 'Pending Review',
      draft: 'Draft',
      'needs-revision': 'Needs Revision',
      rejected: 'Rejected'
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleArchiveArticle = async (articleId, articleTitle) => {
    const confirmed = await showConfirmation({
      title: 'Archive Article',
      message: `Are you sure you want to archive "${articleTitle}"? You can unarchive it later from your archive.`,
      confirmText: 'Archive',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (confirmed) {
      try {
        await articleService.archiveArticle(articleId);
        success('Article archived successfully');
      } catch (err) {
        console.error('Error archiving article:', err);
        error('Failed to archive article. Please try again.');
      }
    }
  };

  const handleDeleteArticle = async (articleId, articleTitle) => {
    const confirmed = await showConfirmation({
      title: 'Delete Article',
      message: `Are you sure you want to delete "${articleTitle}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      try {
        await articleService.deleteArticle(articleId);
        success('Article deleted successfully');
      } catch (err) {
        console.error('Error deleting article:', err);
        error('Failed to delete article. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {userData?.displayName || currentUser?.email}</h1>
          <p className="dashboard-subtitle">Manage your stories and track their progress</p>
        </div>
        <Link to="/create-story" className="create-btn">Create New Story</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Stories</div>
        </div>
        <div className="stat-card published">
          <div className="stat-number">{stats.published}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-number">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card draft">
          <div className="stat-number">{stats.draft}</div>
          <div className="stat-label">Drafts</div>
        </div>
      </div>

      <div className="articles-section">
        <h2 className="section-title">Your Stories</h2>

        {articles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No stories yet</h3>
            <p>Start sharing your thoughts with the world</p>
            <Link to="/create-story" className="empty-cta">Create Your First Story</Link>
          </div>
        ) : (
          <div className="articles-list">
            {articles.map((article) => (
              <div key={article.id} className="article-card">
                <div className="article-content">
                  <div className="article-header">
                    <h3 className="article-title">{article.title}</h3>
                    <span className={`${getStatusBadge(article.status)}${article.isRevised ? ' revised' : ''}`}>
                      {getStatusLabel(article.status, article.isRevised)}
                    </span>
                    {article.isRevised && article.status === 'pending' && (
                      <span className="revised-indicator">✓ Revised</span>
                    )}
                  </div>
                  <p className="article-excerpt">{article.excerpt}</p>
                  <div className="article-meta">
                    <span className="article-date" title={formatTimestamp(article.createdAt, true)}>
                      {formatRelativeTime(article.createdAt)}
                    </span>
                    {article.views > 0 && (
                      <span className="article-views">{article.views} views</span>
                    )}
                    {article.updatedAt && article.updatedAt !== article.createdAt && (
                      <span className="article-updated" title={formatTimestamp(article.updatedAt, true)}>
                        Updated {formatRelativeTime(article.updatedAt)}
                      </span>
                    )}
                  </div>
                  {article.status === 'needs-revision' && article.revisionNote && (
                    <div className="revision-reason">
                      <strong>Requested Changes:</strong> {article.revisionNote}
                    </div>
                  )}
                  {article.status === 'rejected' && article.rejectionReason && (
                    <div className="rejection-reason">
                      <strong>Rejection Reason:</strong> {article.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="article-actions">
                  <Link to={`/edit-article/${article.id}`} className="action-btn edit">Edit</Link>
                  {article.status === 'published' && (
                    <Link to={`/article/${article.id}`} className="action-btn view">View</Link>
                  )}
                  <button
                    onClick={() => handleArchiveArticle(article.id, article.title)}
                    className="action-btn archive"
                  >
                    Archive
                  </button>
                  <button
                    onClick={() => handleDeleteArticle(article.id, article.title)}
                    className="action-btn delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

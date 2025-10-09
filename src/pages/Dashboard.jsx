import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      <div className="exposure-dashboard">
        <div className="loading-state">Loading your stories...</div>
      </div>
    );
  }

  return (
    <div className="exposure-dashboard">
      {/* Exposure-style Header */}
      <header className="exposure-header">
        <nav className="exposure-nav">
          <div className="nav-left">
            <button className="menu-toggle">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <Link to="/" className="logo-link">
              <img src="/indic-logo.svg" alt="INDIC" className="site-logo" />
            </Link>
            <Link to="/" className="nav-link">
              <svg className="icon" viewBox="0 0 20 20" width="20" height="20">
                <path d="M10 2L2 8v11h6v-7h4v7h6V8z" fill="currentColor"/>
              </svg>
              HOME
            </Link>
            <Link to="/stats" className="nav-link">
              <svg className="icon" viewBox="0 0 20 20" width="20" height="20">
                <rect x="2" y="10" width="4" height="8" fill="currentColor"/>
                <rect x="8" y="6" width="4" height="12" fill="currentColor"/>
                <rect x="14" y="2" width="4" height="16" fill="currentColor"/>
              </svg>
              STATS
            </Link>
            <Link to="/subscribers" className="nav-link">
              <svg className="icon" viewBox="0 0 20 20" width="20" height="20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM6 8a2 2 0 11-4 0 2 2 0 014 0zM10 13c-3.3 0-6 2.7-6 6v1h12v-1c0-3.3-2.7-6-6-6zM2 19v-1c0-1.5.6-2.8 1.5-3.8C2.6 14.7 2 15.8 2 17v2zM18 19v-2c0-1.2-.6-2.3-1.5-2.8.9 1 1.5 2.3 1.5 3.8v1z" fill="currentColor"/>
              </svg>
              SUBSCRIBERS
            </Link>
            <Link to="/settings" className="nav-link">
              <svg className="icon" viewBox="0 0 20 20" width="20" height="20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" fill="currentColor"/>
                <path d="M17.5 10c0-.5.1-1 .1-1.5l1.4-1.1c.1-.1.2-.3.1-.5l-1.3-2.2c-.1-.2-.3-.2-.5-.2l-1.7.7c-.5-.4-1.1-.7-1.7-.9l-.4-1.8c0-.2-.2-.3-.4-.3h-2.6c-.2 0-.3.1-.4.3l-.4 1.8c-.6.2-1.2.5-1.7.9l-1.7-.7c-.2 0-.4.1-.5.2L4.5 6.9c-.1.2 0 .4.1.5l1.4 1.1c0 .5.1 1 .1 1.5s-.1 1-.1 1.5l-1.4 1.1c-.1.1-.2.3-.1.5l1.3 2.2c.1.2.3.2.5.2l1.7-.7c.5.4 1.1.7 1.7.9l.4 1.8c0 .2.2.3.4.3h2.6c.2 0 .3-.1.4-.3l.4-1.8c.6-.2 1.2-.5 1.7-.9l1.7.7c.2 0 .4-.1.5-.2l1.3-2.2c.1-.2 0-.4-.1-.5l-1.4-1.1c0-.5-.1-1-.1-1.5z" fill="currentColor"/>
              </svg>
              SETTINGS
            </Link>
          </div>

          <div className="nav-right">
            <button
              onClick={() => navigate('/bookmarks')}
              className="bookmarks-button"
            >
              BOOKMARKS
            </button>
            <button
              onClick={() => navigate('/create-story')}
              className="start-story-button"
            >
              START STORY
            </button>
          </div>
        </nav>
      </header>

      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="28" stroke="#d0d0d0" strokeWidth="1"/>
            <circle cx="30" cy="30" r="20" stroke="#d0d0d0" strokeWidth="1"/>
            <line x1="30" y1="10" x2="30" y2="50" stroke="#d0d0d0" strokeWidth="1"/>
            <line x1="10" y1="30" x2="50" y2="30" stroke="#d0d0d0" strokeWidth="1"/>
            <line x1="16" y1="16" x2="44" y2="44" stroke="#d0d0d0" strokeWidth="1"/>
            <line x1="44" y1="16" x2="16" y2="44" stroke="#d0d0d0" strokeWidth="1"/>
          </svg>
        </div>
        <h1 className="profile-name">{userData?.displayName || currentUser?.email}</h1>
        {stats.published > 0 && (
          <span className="subscriber-badge">SUBSCRIBERS</span>
        )}
      </div>

      {/* Stories Grid */}
      <div className="stories-container">
        <div className="stories-grid">
          {/* Permanent Create Story Card */}
          <div className="story-card create-story-card" onClick={() => navigate('/create-story')}>
            <div className="story-placeholder">
              <div className="create-story-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="create-story-content">
                <h3 className="story-title">DRAFT STORY</h3>
              </div>
            </div>
          </div>

          {/* User Stories */}
          {articles.slice(0, 2).map((article) => (
              <div key={article.id} className="story-card">
                {article.featuredImage ? (
                  <div
                    className="story-image"
                    style={{ backgroundImage: `url(${article.featuredImage})` }}
                  >
                    <div className="story-overlay">
                      <h3 className="story-title">{article.title}</h3>
                    </div>
                    <button
                      className="draft-story-button"
                      onClick={() => navigate(`/edit-article/${article.id}`)}
                    >
                      DRAFT STORY
                    </button>
                  </div>
                ) : (
                  <div className="story-placeholder">
                    <div className="story-content">
                      <h3 className="story-title">{article.title}</h3>
                      <p className="story-excerpt">{article.excerpt}</p>
                    </div>
                    <button
                      className="draft-story-button"
                      onClick={() => navigate(`/edit-article/${article.id}`)}
                    >
                      DRAFT STORY
                    </button>
                  </div>
                )}

                <div className="story-footer">
                  <span className={`story-status ${article.status}`}>
                    {article.status}
                  </span>
                  <span className="story-date">
                    {formatRelativeTime(article.createdAt)}
                  </span>
                  {article.views > 0 && (
                    <span className="story-views">{article.views} views</span>
                  )}
                </div>

                <div className="story-actions">
                  <button
                    onClick={() => navigate(`/edit-article/${article.id}`)}
                    className="action-icon"
                    title="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {article.status === 'published' && (
                    <button
                      onClick={() => window.open(`/article/${article.id}`, '_blank')}
                      className="action-icon"
                      title="View"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteArticle(article.id, article.title)}
                    className="action-icon delete"
                    title="Delete"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
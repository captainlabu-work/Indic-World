import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriberService } from '../firebase/services';
import './Subscribers.css';

const Subscribers = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('recent'); // 'recent' | 'oldest'

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [subs, subCount, followingCount] = await Promise.all([
          subscriberService.getSubscribers(currentUser.uid),
          subscriberService.getSubscriberCount(currentUser.uid),
          subscriberService.getSubscriptionsCount(currentUser.uid)
        ]);
        setSubscribers(subs);
        setSubscriberCount(subCount);
        setSubscriptionsCount(followingCount);
      } catch (err) {
        console.error('Error fetching subscribers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const sortedSubscribers = [...subscribers].sort((a, b) => {
    const aTime = a.subscribedAt?.seconds || 0;
    const bTime = b.subscribedAt?.seconds || 0;
    return sortOrder === 'recent' ? bTime - aTime : aTime - bTime;
  });

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const photoURL = userData?.photoURL || currentUser?.photoURL;

  if (loading) {
    return (
      <div className="subscribers-page">
        <div className="subscribers-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="subscribers-page">
      {/* Header */}
      <header className="subscribers-header">
        <nav className="subscribers-nav">
          <div className="nav-left">
            <Link to="/" className="logo-link">
              <img src="/Indic.png" alt="INDIC" className="site-logo" />
            </Link>
            <Link to="/profile" className="nav-link">PROFILE</Link>
            <Link to="/stats" className="nav-link">STATS</Link>
            <Link to="/subscribers" className="nav-link active">SUBSCRIBERS</Link>
            <Link to="/settings" className="nav-link">SETTINGS</Link>
          </div>
          <div className="nav-right">
            <button onClick={handleSignOut} className="header-btn">SIGN OUT</button>
            <button onClick={() => navigate('/create-story')} className="header-btn primary">START STORY</button>
          </div>
        </nav>
      </header>

      {/* Dashboard Content */}
      <div className="subscribers-content">
        {/* Page Title */}
        <div className="subscribers-title-section">
          <h1 className="subscribers-title">Subscribers</h1>
          <p className="subscribers-subtitle">People who follow your stories</p>
        </div>

        {/* Stats Cards */}
        <div className="subscribers-stats">
          <div className="stat-card">
            <span className="stat-number">{subscriberCount}</span>
            <span className="stat-label">Subscribers</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{subscriptionsCount}</span>
            <span className="stat-label">Following</span>
          </div>
        </div>

        {/* Subscriber List */}
        <div className="subscribers-list-section">
          <div className="list-header">
            <h2 className="list-title">
              {subscriberCount > 0 ? `All Subscribers (${subscriberCount})` : 'Subscribers'}
            </h2>
            {subscribers.length > 1 && (
              <div className="sort-toggle">
                <button
                  className={`sort-btn ${sortOrder === 'recent' ? 'active' : ''}`}
                  onClick={() => setSortOrder('recent')}
                >
                  Recent
                </button>
                <button
                  className={`sort-btn ${sortOrder === 'oldest' ? 'active' : ''}`}
                  onClick={() => setSortOrder('oldest')}
                >
                  Oldest
                </button>
              </div>
            )}
          </div>

          {sortedSubscribers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="empty-title">No subscribers yet</h3>
              <p className="empty-text">Publish stories to start building your audience</p>
              <button className="empty-cta" onClick={() => navigate('/create-story')}>
                Write Your First Story
              </button>
            </div>
          ) : (
            <div className="subscriber-list">
              {sortedSubscribers.map((sub) => (
                <div key={sub.id} className="subscriber-item">
                  <div className="subscriber-avatar">
                    {sub.photoURL ? (
                      <img src={sub.photoURL} alt={sub.displayName} />
                    ) : (
                      <div className="avatar-fallback">
                        {(sub.displayName || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="subscriber-info">
                    <span className="subscriber-name">{sub.displayName}</span>
                    {sub.email && <span className="subscriber-email">{sub.email}</span>}
                  </div>
                  {sub.subscribedAt && (
                    <span className="subscriber-date">{formatDate(sub.subscribedAt)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscribers;

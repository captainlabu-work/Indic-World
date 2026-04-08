import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscriberService } from '../firebase/services';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './Stats.css';

const RANGE_OPTIONS = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: '1 Year', days: 365 },
];

const Stats = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(30);
  const [activeTab, setActiveTab] = useState('metrics');
  const [storySort, setStorySort] = useState('views'); // 'views' | 'date'

  // Compute range boundaries
  const now = useMemo(() => new Date(), []);
  const rangeStart = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - rangeDays);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now, rangeDays]);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    let articlesLoaded = false;
    let subsLoaded = false;
    const checkDone = () => {
      if (articlesLoaded && subsLoaded) setLoading(false);
    };

    // Real-time listener for articles
    const unsubArticles = onSnapshot(
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
        setArticles(userArticles.filter(a => a.status !== 'deleted' && a.status !== 'archived'));
        articlesLoaded = true;
        checkDone();
      },
      (err) => {
        console.error('Error fetching articles:', err);
        articlesLoaded = true;
        checkDone();
      }
    );

    // Fetch raw subscription docs (with subscribedAt)
    const fetchSubs = async () => {
      try {
        const q = query(
          collection(db, 'subscriptions'),
          where('authorId', '==', currentUser.uid),
          orderBy('subscribedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        setSubscribers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      } finally {
        subsLoaded = true;
        checkDone();
      }
    };
    fetchSubs();

    return () => unsubArticles();
  }, [currentUser]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // --- Derived data ---
  const publishedArticles = useMemo(
    () => articles.filter(a => a.status === 'published'),
    [articles]
  );

  const totalViews = useMemo(
    () => articles.reduce((sum, a) => sum + (a.views || 0), 0),
    [articles]
  );

  // Stories published within the selected range
  const storiesInRange = useMemo(
    () => publishedArticles.filter(a => {
      if (!a.publishedAt?.seconds) return false;
      return new Date(a.publishedAt.seconds * 1000) >= rangeStart;
    }),
    [publishedArticles, rangeStart]
  );

  // Subscribers gained in range
  const subsInRange = useMemo(
    () => subscribers.filter(s => {
      if (!s.subscribedAt?.seconds) return false;
      return new Date(s.subscribedAt.seconds * 1000) >= rangeStart;
    }),
    [subscribers, rangeStart]
  );

  // Best day for subscriber growth in range
  const bestDay = useMemo(() => {
    if (subsInRange.length === 0) return null;
    const countByDay = {};
    subsInRange.forEach(s => {
      const d = new Date(s.subscribedAt.seconds * 1000);
      const key = d.toISOString().split('T')[0];
      countByDay[key] = (countByDay[key] || 0) + 1;
    });
    let best = null;
    for (const [day, count] of Object.entries(countByDay)) {
      if (!best || count > best.count) best = { day, count };
    }
    return best;
  }, [subsInRange]);

  // Chart data: daily new subscribers + cumulative total over the range
  const chartData = useMemo(() => {
    const days = [];
    const d = new Date(rangeStart);
    while (d <= now) {
      days.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }

    // Count new subs per day
    const countByDay = {};
    subscribers.forEach(s => {
      if (!s.subscribedAt?.seconds) return;
      const key = new Date(s.subscribedAt.seconds * 1000).toISOString().split('T')[0];
      countByDay[key] = (countByDay[key] || 0) + 1;
    });

    // Count subs before range start (for cumulative baseline)
    let cumulativeBefore = subscribers.filter(s => {
      if (!s.subscribedAt?.seconds) return false;
      return new Date(s.subscribedAt.seconds * 1000) < rangeStart;
    }).length;

    let cumulative = cumulativeBefore;
    return days.map(day => {
      const newSubs = countByDay[day] || 0;
      cumulative += newSubs;
      return {
        date: day,
        label: formatChartDate(day),
        'New Subscribers': newSubs,
        'Total Subscribers': cumulative,
      };
    });
  }, [subscribers, rangeStart, now]);

  // Count published stories per day for chart overlay
  const storiesChartData = useMemo(() => {
    const countByDay = {};
    publishedArticles.forEach(a => {
      if (!a.publishedAt?.seconds) return;
      const key = new Date(a.publishedAt.seconds * 1000).toISOString().split('T')[0];
      countByDay[key] = (countByDay[key] || 0) + 1;
    });
    return countByDay;
  }, [publishedArticles]);

  // Merge stories published into chart data
  const mergedChartData = useMemo(
    () => chartData.map(d => ({
      ...d,
      'Stories Published': storiesChartData[d.date] || 0,
    })),
    [chartData, storiesChartData]
  );

  // Sorted story list
  const sortedStories = useMemo(() => {
    const list = [...publishedArticles];
    if (storySort === 'views') {
      list.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else {
      list.sort((a, b) => {
        const at = a.publishedAt?.seconds || 0;
        const bt = b.publishedAt?.seconds || 0;
        return bt - at;
      });
    }
    return list;
  }, [publishedArticles, storySort]);

  const mostViewed = sortedStories.length > 0 && (sortedStories[0].views || 0) > 0
    ? sortedStories[0]
    : null;

  // --- Date formatting helpers ---
  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const formatCategory = (category) => {
    if (!category) return '';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const rangeLabel = useMemo(() => {
    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    return `${fmt(rangeStart)} – ${fmt(now)}`;
  }, [rangeStart, now]);

  // Determine which tabs to show
  const hasSubData = subscribers.length > 0;
  const hasStoryData = publishedArticles.length > 0;

  const tabs = useMemo(() => {
    const t = [{ id: 'metrics', label: 'Key Metrics' }];
    if (hasSubData) t.push({ id: 'subscribers', label: 'Subscriber Growth' });
    if (hasStoryData) t.push({ id: 'stories', label: 'Story Performance' });
    return t;
  }, [hasSubData, hasStoryData]);

  if (loading) {
    return (
      <div className="stats-page">
        <div className="stats-loading">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="stats-page">
      {/* Header */}
      <header className="stats-header">
        <nav className="stats-nav">
          <div className="nav-left">
            <Link to="/" className="logo-link">
              <img src="/Indic.png" alt="INDIC" className="site-logo" />
            </Link>
            <Link to="/profile" className="nav-link">PROFILE</Link>
            <Link to="/stats" className="nav-link active">STATS</Link>
            <Link to="/subscribers" className="nav-link">SUBSCRIBERS</Link>
            <Link to="/settings" className="nav-link">SETTINGS</Link>
          </div>
          <div className="nav-right">
            <button onClick={handleSignOut} className="header-btn">SIGN OUT</button>
            <button onClick={() => navigate('/create-story')} className="header-btn primary">START STORY</button>
          </div>
        </nav>
      </header>

      {/* Content */}
      <div className="stats-content">
        {/* Page Title + Date Range */}
        <div className="stats-title-row">
          <div className="stats-title-section">
            <h1 className="stats-title">Your Statistics</h1>
            <p className="stats-subtitle">{rangeLabel}</p>
          </div>
          <div className="stats-range-filters">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.days}
                className={`range-btn ${rangeDays === opt.days ? 'active' : ''}`}
                onClick={() => setRangeDays(opt.days)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Bar */}
        {tabs.length > 1 && (
          <div className="stats-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`stats-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ========== KEY METRICS TAB ========== */}
        {activeTab === 'metrics' && (
          <>
            {/* Summary Cards */}
            <div className="stats-summary">
              <div className="stat-card stat-card-dark">
                <span className="stat-number">{totalViews}</span>
                <span className="stat-label">Total Views</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{storiesInRange.length}</span>
                <span className="stat-label">Stories Published</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">{subscribers.length}</span>
                <span className="stat-label">Subscribers</span>
              </div>
              {subsInRange.length > 0 && (
                <div className="stat-card">
                  <span className="stat-number stat-number-accent">+{subsInRange.length}</span>
                  <span className="stat-label">New Subscribers</span>
                </div>
              )}
              {bestDay && (
                <div className="stat-card stat-card-warm">
                  <span className="stat-number stat-number-accent">{bestDay.count}</span>
                  <span className="stat-label">Best Day</span>
                  <span className="stat-detail">{formatBestDay(bestDay.day)}</span>
                </div>
              )}
              {mostViewed && (
                <div className="stat-card stat-card-highlight">
                  <span className="stat-highlight-label">Most Viewed</span>
                  <span className="stat-highlight-title">{mostViewed.title}</span>
                  <span className="stat-highlight-views">{mostViewed.views} views</span>
                </div>
              )}
            </div>

            {/* Key Metrics Chart */}
            {hasSubData ? (
              <div className="stats-chart-section">
                <div className="chart-header">
                  <h2 className="chart-title">Activity Over Time</h2>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={mergedChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradSubs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e07a3a" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#e07a3a" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#8e8e8e' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e5e5' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#8e8e8e' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', paddingBottom: 12 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Total Subscribers"
                        stroke="#1a1a1a"
                        strokeWidth={2}
                        fill="url(#gradSubs)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#1a1a1a' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="New Subscribers"
                        stroke="#e07a3a"
                        strokeWidth={1.5}
                        fill="url(#gradNew)"
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0, fill: '#e07a3a' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="stats-chart-empty">
                <p>No activity data yet. Publish stories and grow your audience to see trends here.</p>
              </div>
            )}
          </>
        )}

        {/* ========== SUBSCRIBER GROWTH TAB ========== */}
        {activeTab === 'subscribers' && hasSubData && (
          <>
            <div className="stats-summary stats-summary-compact">
              <div className="stat-card">
                <span className="stat-number">{subscribers.length}</span>
                <span className="stat-label">Total Subscribers</span>
              </div>
              <div className="stat-card">
                <span className="stat-number stat-number-accent">+{subsInRange.length}</span>
                <span className="stat-label">Gained ({RANGE_OPTIONS.find(r => r.days === rangeDays)?.label})</span>
              </div>
              {bestDay && (
                <div className="stat-card stat-card-warm">
                  <span className="stat-number stat-number-accent">{bestDay.count}</span>
                  <span className="stat-label">Best Day</span>
                  <span className="stat-detail">{formatBestDay(bestDay.day)}</span>
                </div>
              )}
            </div>

            <div className="stats-chart-section">
              <div className="chart-header">
                <h2 className="chart-title">Subscriber Growth</h2>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSubsTab" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradNewTab" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e07a3a" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#e07a3a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#8e8e8e' }}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e5e5' }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#8e8e8e' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11, fill: '#e07a3a' }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, fontFamily: 'Inter', paddingBottom: 12 }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="Total Subscribers"
                      stroke="#1a1a1a"
                      strokeWidth={2}
                      fill="url(#gradSubsTab)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#1a1a1a' }}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="New Subscribers"
                      stroke="#e07a3a"
                      strokeWidth={1.5}
                      fill="url(#gradNewTab)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#e07a3a' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ========== STORY PERFORMANCE TAB ========== */}
        {activeTab === 'stories' && hasStoryData && (
          <div className="stats-list-section">
            <div className="list-header">
              <h2 className="list-title">Story Performance</h2>
              <div className="sort-toggle">
                <button
                  className={`sort-btn ${storySort === 'views' ? 'active' : ''}`}
                  onClick={() => setStorySort('views')}
                >
                  Most Viewed
                </button>
                <button
                  className={`sort-btn ${storySort === 'date' ? 'active' : ''}`}
                  onClick={() => setStorySort('date')}
                >
                  Recent
                </button>
              </div>
            </div>
            <div className="stats-story-list">
              {sortedStories.map((article, index) => (
                <div
                  key={article.id}
                  className={`stats-story-item ${index === 0 && storySort === 'views' && (article.views || 0) > 0 ? 'top-story' : ''}`}
                  onClick={() => window.open(`/article/${article.id}`, '_blank')}
                >
                  {index === 0 && storySort === 'views' && (article.views || 0) > 0 && (
                    <span className="top-badge">TOP</span>
                  )}
                  <div className="stats-story-info">
                    <span className="stats-story-title">{article.title}</span>
                    <div className="stats-story-meta">
                      {article.category && (
                        <span className="stats-story-category">{formatCategory(article.category)}</span>
                      )}
                      {article.publishedAt && (
                        <span className="stats-story-date">{formatDate(article.publishedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="stats-story-views">
                    <span className="views-count">{article.views || 0}</span>
                    <span className="views-label">views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full empty state — no articles at all */}
        {!hasStoryData && activeTab === 'stories' && (
          <div className="stats-empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="12" width="4" height="8" rx="1" stroke="#ccc" strokeWidth="1.5"/>
                <rect x="10" y="8" width="4" height="12" rx="1" stroke="#ccc" strokeWidth="1.5"/>
                <rect x="17" y="4" width="4" height="16" rx="1" stroke="#ccc" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="empty-title">No published stories yet</h3>
            <p className="empty-text">Publish your first story to start tracking performance</p>
            <button className="empty-cta" onClick={() => navigate('/create-story')}>
              Start a Story
            </button>
          </div>
        )}

        {/* Global empty — brand new creator */}
        {!hasStoryData && !hasSubData && activeTab === 'metrics' && (
          <div className="stats-empty-state">
            <div className="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="12" width="4" height="8" rx="1" stroke="#ccc" strokeWidth="1.5"/>
                <rect x="10" y="8" width="4" height="12" rx="1" stroke="#ccc" strokeWidth="1.5"/>
                <rect x="17" y="4" width="4" height="16" rx="1" stroke="#ccc" strokeWidth="1.5"/>
              </svg>
            </div>
            <h3 className="empty-title">No statistics yet</h3>
            <p className="empty-text">Publish stories and grow your audience to see your stats come to life</p>
            <button className="empty-cta" onClick={() => navigate('/create-story')}>
              Start a Story
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="stats-tooltip">
      <span className="tooltip-date">{label}</span>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="tooltip-row">
          <span className="tooltip-dot" style={{ background: entry.color }} />
          <span className="tooltip-key">{entry.dataKey}</span>
          <span className="tooltip-val">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// --- Helpers ---
function formatChartDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatBestDay(isoDate) {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default Stats;

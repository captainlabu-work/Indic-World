import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService, articleService, subscriberService } from '../firebase/services';
import { formatTimestamp } from '../utils/formatters';
import './AuthorProfile.css';

const AuthorProfile = () => {
  const { uid } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [author, setAuthor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, publishedArticles, subCount] = await Promise.all([
          userService.getUserData(uid),
          articleService.getPublishedArticlesByAuthor(uid),
          subscriberService.getSubscriberCount(uid)
        ]);
        setAuthor(userData);
        setArticles(publishedArticles);
        setSubscriberCount(subCount);

        if (currentUser && currentUser.uid !== uid) {
          const subscribed = await subscriberService.isSubscribed(currentUser.uid, uid);
          setIsSubscribed(subscribed);
        }
      } catch (err) {
        console.error('Error fetching author profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [uid, currentUser]);

  const handleSubscribe = async () => {
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    setSubLoading(true);
    try {
      if (isSubscribed) {
        await subscriberService.unsubscribe(currentUser.uid, uid);
        setIsSubscribed(false);
        setSubscriberCount(c => c - 1);
      } else {
        await subscriberService.subscribe(currentUser.uid, uid);
        setIsSubscribed(true);
        setSubscriberCount(c => c + 1);
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    } finally {
      setSubLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="author-profile-page">
        <div className="author-loading">Loading...</div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="author-profile-page">
        <div className="author-not-found">
          <h2>Author not found</h2>
          <Link to="/" className="back-home-link">Back to Home</Link>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === uid;

  return (
    <div className="author-profile-page">
      {/* Author Header */}
      <section className="author-header">
        <div className="author-avatar-large">
          {author.photoURL ? (
            <img src={author.photoURL} alt={author.displayName} />
          ) : (
            <div className="author-avatar-fallback">
              {(author.displayName || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="author-display-name">{author.displayName}</h1>
        <p className="author-bio">Storyteller at Indic</p>

        <div className="author-stats-row">
          <span className="author-stat">
            <strong>{articles.length}</strong> {articles.length === 1 ? 'story' : 'stories'}
          </span>
          <span className="author-stat-divider">&bull;</span>
          <span className="author-stat">
            <strong>{subscriberCount}</strong> {subscriberCount === 1 ? 'subscriber' : 'subscribers'}
          </span>
        </div>

        {!isOwnProfile && (
          <button
            className={`author-subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
            onClick={handleSubscribe}
            disabled={subLoading}
          >
            {subLoading ? '...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        )}

        {isOwnProfile && (
          <Link to="/profile" className="author-edit-link">Edit Profile</Link>
        )}
      </section>

      {/* Published Stories */}
      <section className="author-stories-section">
        <h2 className="author-stories-heading">Published Stories</h2>

        {articles.length === 0 ? (
          <p className="author-no-stories">No published stories yet.</p>
        ) : (
          <div className="author-stories-grid">
            {articles.map(article => (
              <article
                key={article.id}
                className="author-story-card"
                onClick={() => navigate(`/article/${article.id}`)}
              >
                {article.featuredImage && (
                  <div className="author-card-image">
                    <img src={article.featuredImage} alt={article.title} loading="lazy" />
                  </div>
                )}
                <div className="author-card-body">
                  {article.tags?.[0] && (
                    <span className="author-card-tag">{article.tags[0]}</span>
                  )}
                  <h3 className="author-card-title">{article.title}</h3>
                  {article.excerpt && (
                    <p className="author-card-excerpt">{article.excerpt}</p>
                  )}
                  <span className="author-card-date">
                    {formatTimestamp(article.publishedAt || article.createdAt, false)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AuthorProfile;

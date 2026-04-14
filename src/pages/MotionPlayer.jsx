import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { articleService, subscriberService } from '../firebase/services';
import { formatTimestamp } from '../utils/formatters';
import { useNotification } from '../components/common/NotificationSystem';
import './MotionPlayer.css';

const MotionPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { success, error: showError } = useNotification();
  const videoRef = useRef(null);

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Admin review
  const [actionLoading, setActionLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  // Subscribe
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const articleDoc = await getDoc(doc(db, 'articles', id));
        if (articleDoc.exists()) {
          const data = { id: articleDoc.id, ...articleDoc.data() };

          if (data.status !== 'published' && !isAdmin &&
              (!currentUser || currentUser.uid !== data.authorId)) {
            setError('Video not found');
            setLoading(false);
            return;
          }

          setArticle(data);

          // Increment views
          if (data.status === 'published' &&
              (!currentUser || currentUser.uid !== data.authorId)) {
            try {
              await updateDoc(doc(db, 'articles', id), { views: increment(1) });
            } catch { /* non-critical */ }
          }
        } else {
          setError('Video not found');
        }
      } catch (err) {
        console.error('Error fetching motion:', err);
        setError('Failed to load video');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id, currentUser, isAdmin]);

  // Subscription check
  useEffect(() => {
    if (currentUser && article?.authorId && currentUser.uid !== article.authorId) {
      subscriberService.isSubscribed(currentUser.uid, article.authorId)
        .then(setIsSubscribed)
        .catch(() => {});
    }
  }, [currentUser, article?.authorId]);

  const handleSubscribe = async () => {
    if (!currentUser) { navigate('/auth'); return; }
    setSubLoading(true);
    try {
      if (isSubscribed) {
        await subscriberService.unsubscribe(currentUser.uid, article.authorId);
        setIsSubscribed(false);
        success('Unsubscribed');
      } else {
        await subscriberService.subscribe(currentUser.uid, article.authorId);
        setIsSubscribed(true);
        success('Subscribed!');
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      showError(err.message || 'Failed to subscribe');
    } finally {
      setSubLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Admin actions
  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await articleService.approveArticle(id);
      setArticle(prev => ({ ...prev, status: 'published' }));
      success('Video approved and published!');
    } catch { showError('Failed to approve'); }
    finally { setActionLoading(false); }
  };

  const handleRequestChanges = async () => {
    if (!feedbackText.trim()) { showError('Please provide feedback'); return; }
    setActionLoading(true);
    try {
      await articleService.requestChanges(id, feedbackText);
      setShowFeedback(false);
      setFeedbackText('');
      success('Sent back for revision');
      navigate('/admin');
    } catch { showError('Failed to request changes'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!feedbackText.trim()) { showError('Please provide a reason'); return; }
    setActionLoading(true);
    try {
      await articleService.rejectArticle(id, feedbackText);
      setShowFeedback(false);
      setFeedbackText('');
      success('Video rejected');
      navigate('/admin');
    } catch { showError('Failed to reject'); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="mp-loading">
        <div className="mp-spinner"></div>
        <p>Loading video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mp-error">
        <h2>Oops!</h2>
        <p>{error}</p>
        <Link to="/motion" className="mp-back-btn">Back to Motion</Link>
      </div>
    );
  }

  const isPending = article.status === 'pending' || article.status === 'needs-revision';
  const showAdminBar = isAdmin && article.status !== 'published';

  return (
    <div className="motion-player-page">
      {/* Admin review bar */}
      {showAdminBar && (
        <div className="mp-admin-bar">
          <div className="mp-admin-inner">
            <div className="mp-admin-status">
              <span className={`review-badge status-${article.status}`}>
                {article.status === 'needs-revision' ? 'Needs Revision' : article.status}
              </span>
              <span className="mp-admin-label">Admin Review</span>
            </div>
            {isPending && (
              <div className="mp-admin-actions">
                <button className="review-btn review-approve" onClick={handleApprove} disabled={actionLoading}>
                  {actionLoading ? 'Approving...' : 'Approve & Publish'}
                </button>
                <button className="review-btn review-feedback" onClick={() => setShowFeedback(!showFeedback)} disabled={actionLoading}>
                  Feedback
                </button>
              </div>
            )}
          </div>
          {showFeedback && (
            <div className="mp-feedback-panel">
              <textarea
                placeholder="Write feedback for the creator..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="mp-feedback-textarea"
              />
              <div className="mp-feedback-actions">
                <button className="review-btn review-feedback" onClick={handleRequestChanges} disabled={actionLoading}>
                  {actionLoading ? 'Sending...' : 'Request Changes'}
                </button>
                <button className="review-btn review-reject" onClick={handleReject} disabled={actionLoading}>
                  {actionLoading ? 'Rejecting...' : 'Reject'}
                </button>
                <button className="review-btn review-cancel" onClick={() => { setShowFeedback(false); setFeedbackText(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hero: Full-width video player */}
      <div className="mp-hero">
        <div className="mp-video-wrapper">
          {article.content ? (
            <video
              ref={videoRef}
              src={article.content}
              poster={article.featuredImage}
              controls
              playsInline
              className="mp-video"
            />
          ) : article.featuredImage ? (
            <div className="mp-poster-only">
              <img src={article.featuredImage} alt={article.title} />
              <div className="mp-no-video-msg">Video unavailable</div>
            </div>
          ) : (
            <div className="mp-no-media">
              <p>No video available</p>
            </div>
          )}
        </div>
      </div>

      {/* Info section below the player */}
      <div className="mp-info">
        <div className="mp-info-inner">
          {/* Title */}
          <h1 className="mp-title">{article.title}</h1>

          {/* Metadata row */}
          <div className="mp-meta">
            {article.motionType && (
              <span className="mp-meta-badge">{article.motionType}</span>
            )}
            {article.motionTheme && (
              <span className="mp-meta-badge mp-meta-badge--theme">{article.motionTheme}</span>
            )}
            <span className="mp-meta-date">
              {formatTimestamp(article.publishedAt || article.createdAt, false)}
            </span>
            {article.views > 0 && (
              <span className="mp-meta-views">{article.views.toLocaleString()} views</span>
            )}
          </div>

          {/* Actions row */}
          <div className="mp-actions-row">
            <button className="mp-action-btn" onClick={handleCopyLink}>
              {copied ? 'Link Copied!' : 'Share'}
            </button>
            {currentUser && currentUser.uid === article.authorId && (
              <Link to={`/edit-article/${article.id}`} className="mp-action-btn mp-action-btn--outline">
                Edit
              </Link>
            )}
          </div>

          {/* Divider */}
          <div className="mp-divider"></div>

          {/* Description / Synopsis */}
          {article.excerpt && (
            <div className="mp-synopsis">
              <p>{article.excerpt}</p>
            </div>
          )}

          {/* Author section */}
          <div className="mp-author">
            <div className="mp-author-info">
              <span className="mp-author-label">Created by</span>
              <Link to={`/author/${article.authorId}`} className="mp-author-name">
                {article.authorName}
              </Link>
            </div>
            {currentUser?.uid !== article.authorId && (
              <button
                className={`mp-subscribe-btn ${isSubscribed ? 'mp-subscribe-btn--active' : ''}`}
                onClick={handleSubscribe}
                disabled={subLoading}
              >
                {subLoading ? '...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mp-tags">
              {article.tags.map((tag, i) => (
                <span key={i} className="mp-tag">{tag}</span>
              ))}
            </div>
          )}

          {/* Back nav */}
          <div className="mp-back">
            <Link to="/motion" className="mp-back-link">&larr; Back to Motion</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotionPlayer;

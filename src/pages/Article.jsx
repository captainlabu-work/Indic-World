import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { articleService, subscriberService } from '../firebase/services';
import { formatTimestamp } from '../utils/formatters';
import { useNotification } from '../components/common/NotificationSystem';
import './Article.css';

const Article = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { success, error: showError } = useNotification();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const articleDoc = await getDoc(doc(db, 'articles', id));

        if (articleDoc.exists()) {
          const articleData = {
            id: articleDoc.id,
            ...articleDoc.data()
          };

          if (articleData.status !== 'published' &&
              !isAdmin &&
              (!currentUser || currentUser.uid !== articleData.authorId)) {
            setError('Article not found');
            setLoading(false);
            return;
          }

          setArticle(articleData);

          if (articleData.status === 'published' &&
              (!currentUser || currentUser.uid !== articleData.authorId)) {
            try {
              await updateDoc(doc(db, 'articles', id), {
                views: increment(1)
              });
            } catch {
              // View increment may fail for anonymous users — non-critical
            }
          }
        } else {
          setError('Article not found');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, currentUser, isAdmin]);

  // Check subscription status
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
      } else {
        await subscriberService.subscribe(currentUser.uid, article.authorId);
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Subscribe error:', err);
    } finally {
      setSubLoading(false);
    }
  };

  const getReadingTime = (content) => {
    if (!content) return '1 min';
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.split(/\s+/).filter(Boolean).length;
    return `${Math.ceil(words / 200)} min`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await articleService.approveArticle(id);
      setArticle(prev => ({ ...prev, status: 'published' }));
      success('Article approved and published!');
    } catch (err) {
      showError('Failed to approve article');
    } finally {
      setActionLoading(false);
    }
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
    } catch (err) {
      showError('Failed to request changes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!feedbackText.trim()) { showError('Please provide a reason'); return; }
    setActionLoading(true);
    try {
      await articleService.rejectArticle(id, feedbackText);
      setShowFeedback(false);
      setFeedbackText('');
      success('Article rejected');
      navigate('/admin');
    } catch (err) {
      showError('Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="article-loading">
        <div className="loading-spinner"></div>
        <p>Loading story...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="article-error">
        <h2>Oops!</h2>
        <p>{error}</p>
        <Link to="/" className="back-home">Back to Home</Link>
      </div>
    );
  }

  const isPending = article.status === 'pending' || article.status === 'needs-revision';
  const showAdminBar = isAdmin && article.status !== 'published';

  return (
    <div className="article-page">
      {/* Admin review bar */}
      {showAdminBar && (
        <div className="admin-review-bar">
          <div className="admin-review-inner">
            <div className="admin-review-status">
              <span className={`review-badge status-${article.status}`}>
                {article.status === 'needs-revision' ? 'Needs Revision' : article.status}
              </span>
              <span className="review-label">Admin Review</span>
            </div>
            {isPending && (
              <div className="admin-review-actions">
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
            <div className="admin-feedback-panel">
              <textarea
                placeholder="Write feedback for the author..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="feedback-textarea"
              />
              <div className="feedback-actions">
                <button className="review-btn review-feedback" onClick={handleRequestChanges} disabled={actionLoading}>
                  {actionLoading ? 'Sending...' : 'Request Changes'}
                </button>
                <button className="review-btn review-reject" onClick={handleReject} disabled={actionLoading}>
                  {actionLoading ? 'Rejecting...' : 'Reject Permanently'}
                </button>
                <button className="review-btn review-cancel" onClick={() => { setShowFeedback(false); setFeedbackText(''); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Featured image — wide */}
      {article.featuredImage && (
        <div className="article-hero">
          <img src={article.featuredImage} alt={article.title} />
          {article.thumbnailCaption && (
            <p className="article-hero-caption">{article.thumbnailCaption}</p>
          )}
        </div>
      )}

      <article className="article-content">
        {/* Header */}
        <header className="article-header">
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span className="author-info">
              By <Link to={`/author/${article.authorId}`} className="author-name author-link">{article.authorName}</Link>
            </span>
            <span className="meta-separator">&bull;</span>
            <span className="publish-date">
              {formatTimestamp(article.publishedAt || article.createdAt, false)}
            </span>
            <span className="meta-separator">&bull;</span>
            <span className="reading-time">{getReadingTime(article.content)} read</span>
          </div>
          {article.sourceText && (
            <div className="article-source">
              Source: {article.sourceText}
            </div>
          )}
        </header>

        {/* Excerpt */}
        {article.excerpt && (
          <div className="article-excerpt">
            <p>{article.excerpt}</p>
          </div>
        )}

        {/* Body */}
        <div
          className="article-body tiptap-content"
          dangerouslySetInnerHTML={{ __html: article.content || '' }}
        />

        {/* Tags */}
        <div className="article-tags">
          {article.category && (
            <span className="article-category">{article.category}</span>
          )}
          {article.tags && article.tags.map((tag, i) => (
            <span key={i} className="article-tag">{tag}</span>
          ))}
        </div>
      </article>

      {/* End matter — author, share, nav */}
      <footer className="article-endmatter">
        <div className="endmatter-divider"></div>

        <div className="endmatter-author">
          <div className="endmatter-author-info">
            <span className="endmatter-written-by">Written by</span>
            <Link to={`/author/${article.authorId}`} className="endmatter-name-link">
              <h3 className="endmatter-name">{article.authorName}</h3>
            </Link>
            <p className="endmatter-bio">Storyteller at Indic</p>
            {currentUser?.uid !== article.authorId && (
              <button
                className={`article-subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
                onClick={handleSubscribe}
                disabled={subLoading}
              >
                {subLoading ? '...' : isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>

        <div className="endmatter-actions">
          <button className="endmatter-share" onClick={handleCopyLink}>
            {copied ? 'Link Copied!' : 'Copy Link'}
          </button>
          {currentUser && currentUser.uid === article.authorId && (
            <Link to={`/edit-article/${article.id}`} className="endmatter-edit">
              Edit Story
            </Link>
          )}
        </div>

        <div className="endmatter-back">
          <Link to="/" className="back-link">&larr; Back to Stories</Link>
        </div>
      </footer>
    </div>
  );
};

export default Article;

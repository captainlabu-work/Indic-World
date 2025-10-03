import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { formatTimestamp } from '../utils/formatters';
import './Article.css';

const Article = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const articleDoc = await getDoc(doc(db, 'articles', id));

        if (articleDoc.exists()) {
          const articleData = {
            id: articleDoc.id,
            ...articleDoc.data()
          };

          // Only show published articles to non-authors
          if (articleData.status !== 'published' &&
              (!currentUser || currentUser.uid !== articleData.authorId)) {
            setError('Article not found');
            setLoading(false);
            return;
          }

          setArticle(articleData);

          // Increment view count
          await updateDoc(doc(db, 'articles', id), {
            views: increment(1)
          });
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
  }, [id, currentUser]);

  const getReadingTime = (content) => {
    if (!content) return '1 min';
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  };

  const formatContent = (content) => {
    if (!content) return '';

    // Convert markdown-style formatting to HTML
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    return `<p>${formatted}</p>`;
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

  return (
    <div className="article-container">
      <article className="article-content">
        <header className="article-header">
          <h1 className="article-title">{article.title}</h1>
          <div className="article-meta">
            <span className="author-info">
              By <span className="author-name">{article.authorName}</span>
            </span>
            <span className="meta-separator">•</span>
            <span className="publish-date">
              {formatTimestamp(article.publishedAt || article.createdAt, false)}
            </span>
            <span className="meta-separator">•</span>
            <span className="reading-time">{getReadingTime(article.content)} read</span>
          </div>
        </header>

        {article.excerpt && (
          <div className="article-excerpt">
            <p>{article.excerpt}</p>
          </div>
        )}

        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
        />

        <footer className="article-footer">
          <div className="article-tags">
            {article.category && (
              <span className="article-category">{article.category}</span>
            )}
          </div>

          {currentUser && currentUser.uid === article.authorId && (
            <div className="author-actions">
              <Link to={`/edit-article/${article.id}`} className="edit-link">
                Edit Story
              </Link>
            </div>
          )}
        </footer>
      </article>

      <aside className="article-sidebar">
        <div className="author-card">
          <h3>About the Author</h3>
          <p className="author-name">{article.authorName}</p>
          <p className="author-bio">Storyteller at Indic</p>
        </div>

        <div className="share-card">
          <h3>Share this story</h3>
          <div className="share-buttons">
            <button
              className="share-btn"
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              Copy Link
            </button>
          </div>
        </div>

        <div className="back-navigation">
          <Link to="/" className="back-link">← Back to Stories</Link>
        </div>
      </aside>
    </div>
  );
};

export default Article;
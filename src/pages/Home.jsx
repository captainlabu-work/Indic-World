import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch published articles
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'articles'),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        const publishedArticles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Set the most recent article as featured
        if (publishedArticles.length > 0) {
          setFeaturedArticle(publishedArticles[0]);
          setArticles(publishedArticles.slice(1));
        } else {
          setArticles(publishedArticles);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching articles:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          article.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          article.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getReadingTime = (content) => {
    if (!content) return '1 min read';
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const handleArticleClick = (articleId) => {
    navigate(`/article/${articleId}`);
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Stories That Matter</h1>
          <p className="hero-subtitle">
            Discover authentic voices, raw narratives, and thoughtful perspectives from storytellers around the world
          </p>
          {!currentUser && (
            <div className="hero-cta">
              <Link to="/auth" className="hero-button primary">Start Writing</Link>
              <Link to="/auth" className="hero-button secondary">Join Community</Link>
            </div>
          )}
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="filter-section">
        <div className="filter-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search stories, authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="category-filters">
            <button
              className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Stories
            </button>
            <button
              className={`category-btn ${selectedCategory === 'fiction' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('fiction')}
            >
              Fiction
            </button>
            <button
              className={`category-btn ${selectedCategory === 'non-fiction' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('non-fiction')}
            >
              Non-Fiction
            </button>
            <button
              className={`category-btn ${selectedCategory === 'poetry' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('poetry')}
            >
              Poetry
            </button>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {featuredArticle && (
        <section className="featured-section">
          <h2 className="section-title">Featured Story</h2>
          <article className="featured-article" onClick={() => handleArticleClick(featuredArticle.id)}>
            <div className="featured-content">
              <div className="featured-badge">Featured</div>
              <h2 className="featured-title">{featuredArticle.title}</h2>
              <p className="featured-excerpt">{featuredArticle.excerpt}</p>
              <div className="featured-meta">
                <span className="author-name">{featuredArticle.authorName}</span>
                <span className="meta-divider">•</span>
                <span className="publish-date">{formatDate(featuredArticle.publishedAt)}</span>
                <span className="meta-divider">•</span>
                <span className="reading-time">{getReadingTime(featuredArticle.content)}</span>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* Articles Grid */}
      <section className="articles-section">
        <h2 className="section-title">Latest Stories</h2>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading stories...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="empty-state">
            <h3>No stories found</h3>
            <p>
              {searchTerm ? 'Try adjusting your search terms' : 'Be the first to share your story!'}
            </p>
            {currentUser && (
              <Link to="/create-story" className="cta-button">Write a Story</Link>
            )}
          </div>
        ) : (
          <div className="articles-grid">
            {filteredArticles.map(article => (
              <article
                key={article.id}
                className="article-card"
                onClick={() => handleArticleClick(article.id)}
              >
                <div className="article-content">
                  <h3 className="article-title">{article.title}</h3>
                  <p className="article-excerpt">{article.excerpt}</p>
                  <div className="article-meta">
                    <span className="author-name">{article.authorName}</span>
                    <div className="meta-details">
                      <span className="publish-date">{formatDate(article.publishedAt)}</span>
                      <span className="meta-divider">•</span>
                      <span className="reading-time">{getReadingTime(article.content)}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action for non-logged in users */}
      {!currentUser && articles.length > 0 && (
        <section className="cta-section">
          <div className="cta-content">
            <h2>Ready to Share Your Story?</h2>
            <p>Join our community of storytellers and make your voice heard</p>
            <Link to="/auth" className="cta-button large">Get Started Today</Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;

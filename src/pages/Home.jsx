import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState({
    word: null,
    lens: null,
    motion: null
  });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Category definitions
  const categories = {
    word: {
      title: 'Indic Word',
      subtitle: 'Op-eds, Reportage & Written Narratives',
      description: 'Powerful written stories that shape perspectives',
      icon: '✍️',
      color: '#2C3E50'
    },
    lens: {
      title: 'Indic Lens',
      subtitle: 'Photo Essays & Visual Journalism',
      description: 'Stories told through compelling imagery',
      icon: '📸',
      color: '#8E44AD'
    },
    motion: {
      title: 'Indic Motion',
      subtitle: 'Documentaries & Films',
      description: 'Moving pictures that move hearts',
      icon: '🎬',
      color: '#C0392B'
    }
  };

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

        // Categorize articles
        const wordArticles = publishedArticles.filter(a => !a.category || a.category === 'word');
        const lensArticles = publishedArticles.filter(a => a.category === 'lens');
        const motionArticles = publishedArticles.filter(a => a.category === 'motion');

        // Set featured articles for each category
        setFeaturedArticles({
          word: wordArticles[0] || null,
          lens: lensArticles[0] || null,
          motion: motionArticles[0] || null
        });

        setArticles(publishedArticles);
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
    if (selectedCategory === 'all') return true;
    return article.category === selectedCategory;
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
    if (!content) return '1 min';
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  };

  const handleArticleClick = (articleId) => {
    navigate(`/article/${articleId}`);
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Stories That Shape Culture</h1>
          <p className="hero-subtitle">
            A storytelling platform celebrating diverse narratives through words, visuals, and motion
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="categories-container">
          {Object.entries(categories).map(([key, category]) => (
            <div
              key={key}
              className={`category-card ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
              style={{ borderColor: category.color }}
            >
              <div className="category-icon" style={{ backgroundColor: category.color }}>
                <span>{category.icon}</span>
              </div>
              <h3 className="category-title">{category.title}</h3>
              <p className="category-subtitle">{category.subtitle}</p>
              <p className="category-description">{category.description}</p>
              {featuredArticles[key] && (
                <div className="category-stats">
                  <span className="story-count">
                    {articles.filter(a => a.category === key).length} stories
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Filter Bar */}
      <section className="filter-bar">
        <div className="filter-controls">
          <button
            className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Stories
          </button>
          <button
            className={`filter-btn ${selectedCategory === 'word' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('word')}
            style={{ borderColor: selectedCategory === 'word' ? categories.word.color : '' }}
          >
            {categories.word.icon} Indic Word
          </button>
          <button
            className={`filter-btn ${selectedCategory === 'lens' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('lens')}
            style={{ borderColor: selectedCategory === 'lens' ? categories.lens.color : '' }}
          >
            {categories.lens.icon} Indic Lens
          </button>
          <button
            className={`filter-btn ${selectedCategory === 'motion' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('motion')}
            style={{ borderColor: selectedCategory === 'motion' ? categories.motion.color : '' }}
          >
            {categories.motion.icon} Indic Motion
          </button>
        </div>
      </section>

      {/* Featured Content by Category */}
      {selectedCategory === 'all' && (
        <section className="featured-categories">
          {Object.entries(featuredArticles).map(([key, article]) => {
            if (!article) return null;
            const category = categories[key];
            return (
              <div key={key} className="featured-category-section">
                <div className="featured-header" style={{ borderColor: category.color }}>
                  <h2 className="featured-category-title">
                    <span style={{ color: category.color }}>{category.icon}</span>
                    Featured in {category.title}
                  </h2>
                </div>
                <article
                  className="featured-article"
                  onClick={() => handleArticleClick(article.id)}
                  style={{ borderLeft: `4px solid ${category.color}` }}
                >
                  <div className="featured-content">
                    <h3 className="featured-title">{article.title}</h3>
                    <p className="featured-excerpt">{article.excerpt}</p>
                    <div className="featured-meta">
                      <span className="author-name">{article.authorName}</span>
                      <span className="meta-divider">•</span>
                      <span className="publish-date">{formatDate(article.publishedAt)}</span>
                      <span className="meta-divider">•</span>
                      <span className="reading-time">{getReadingTime(article.content)}</span>
                    </div>
                  </div>
                  {article.featuredImage && (
                    <div className="featured-image">
                      <img src={article.featuredImage} alt={article.title} />
                    </div>
                  )}
                </article>
              </div>
            );
          })}
        </section>
      )}

      {/* Articles Grid */}
      <section className="articles-section">
        <h2 className="section-title">
          {selectedCategory === 'all'
            ? 'All Stories'
            : `${categories[selectedCategory]?.title} Stories`}
        </h2>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading stories...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="empty-state">
            <h3>No stories yet</h3>
            <p>
              Be the first to contribute to {selectedCategory === 'all'
                ? 'our storytelling platform'
                : categories[selectedCategory]?.title}!
            </p>
            {currentUser && (
              <Link to="/create-story" className="cta-button">Create Story</Link>
            )}
          </div>
        ) : (
          <div className="articles-grid">
            {filteredArticles.map(article => {
              const articleCategory = article.category || 'word';
              const categoryColor = categories[articleCategory]?.color || '#2C3E50';
              return (
                <article
                  key={article.id}
                  className="article-card"
                  onClick={() => handleArticleClick(article.id)}
                  style={{ borderTop: `3px solid ${categoryColor}` }}
                >
                  <div className="article-category-badge" style={{ backgroundColor: categoryColor }}>
                    {categories[articleCategory]?.icon} {categories[articleCategory]?.title}
                  </div>
                  {article.featuredImage && (
                    <div className="article-image">
                      <img src={article.featuredImage} alt={article.title} />
                    </div>
                  )}
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
              );
            })}
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Share Your Story</h2>
          <p>Join our community of storytellers across words, visuals, and motion</p>
          <div className="cta-categories">
            <div className="cta-category">
              <span className="cta-icon">{categories.word.icon}</span>
              <p>Write compelling narratives</p>
            </div>
            <div className="cta-category">
              <span className="cta-icon">{categories.lens.icon}</span>
              <p>Share visual stories</p>
            </div>
            <div className="cta-category">
              <span className="cta-icon">{categories.motion.icon}</span>
              <p>Create moving pictures</p>
            </div>
          </div>
          {currentUser ? (
            <Link to="/create-story" className="cta-button large">Create Your Story</Link>
          ) : (
            <Link to="/auth" className="cta-button large">Join Indic</Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
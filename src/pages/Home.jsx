import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService } from '../firebase/services';
import './Home.css';

const Home = () => {
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const articles = await articleService.getPublishedArticles(12);
        setPublishedArticles(articles);
      } catch (err) {
        console.error('Error fetching published articles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublished();
  }, []);

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'word': return 'WORD';
      case 'lens': return 'LENS';
      case 'motion': return 'MOTION';
      default: return 'WORD';
    }
  };

  const featuredArticle = publishedArticles[0];
  const gridArticles = publishedArticles.slice(1);

  return (
    <div className="home-container">
      {/* Hero Banner */}
      <section className="home-hero">
        <div className="home-hero-bg">
          <div className="home-hero-content">
            <h1 className="home-hero-title">Indic</h1>
            <p className="home-hero-sub">Stories that matter. Voices that resonate.</p>
            {currentUser ? (
              <Link to="/create-story" className="home-hero-btn">Start Writing</Link>
            ) : (
              <Link to="/auth" className="home-hero-btn">Join Indic</Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured Article */}
      {!loading && featuredArticle && (
        <section className="home-featured" onClick={() => navigate(`/article/${featuredArticle.id}`)}>
          <div className="home-featured-image">
            <img
              src={featuredArticle.featuredImage || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2028'}
              alt={featuredArticle.title}
            />
          </div>
          <div className="home-featured-info">
            <span className="home-tag">{featuredArticle.tags?.[0] || getCategoryLabel(featuredArticle.category)}</span>
            <h2 className="home-featured-title">{featuredArticle.title}</h2>
            {featuredArticle.excerpt && <p className="home-featured-excerpt">{featuredArticle.excerpt}</p>}
            <span className="home-featured-author">{featuredArticle.authorName}</span>
          </div>
        </section>
      )}

      {/* Stories Grid */}
      {!loading && gridArticles.length > 0 && (
        <section className="home-stories">
          <div className="home-stories-grid">
            {gridArticles.map((article) => (
              <article
                key={article.id}
                className="home-card"
                onClick={() => navigate(`/article/${article.id}`)}
              >
                <div className="home-card-image">
                  <img
                    src={article.featuredImage || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2028'}
                    alt={article.title}
                    loading="lazy"
                  />
                </div>
                <div className="home-card-body">
                  <span className="home-tag">{article.tags?.[0] || getCategoryLabel(article.category)}</span>
                  <h3 className="home-card-title">{article.title}</h3>
                  <span className="home-card-author">{article.authorName}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Empty state when no published articles */}
      {!loading && publishedArticles.length === 0 && (
        <section className="home-empty">
          <h2>No work published here yet.</h2>
          <p>Stories will appear here once they are published. Be the first to contribute.</p>
          {currentUser && (
            <Link to="/create-story" className="home-empty-btn">Create a Story</Link>
          )}
        </section>
      )}

      {/* Loading */}
      {loading && (
        <section className="home-loading">
          <div className="home-spinner"></div>
          <p>Loading stories...</p>
        </section>
      )}

      {/* Explore Categories */}
      <section className="explore-section">
        <div className="section-header">
          <h2 className="section-title">Explore</h2>
          <p className="section-subtitle">Discover stories across different mediums</p>
        </div>
        <div className="category-overlays">
          <Link to="/word" className="category-overlay">
            <div className="category-overlay-bg" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2073')` }}>
              <div className="category-overlay-content">
                <div className="category-label"><span className="category-icon">✍️</span><h3>Indic Word</h3></div>
                <p className="category-description">Written narratives & reportage</p>
                <span className="explore-link">Explore Word →</span>
              </div>
            </div>
          </Link>
          <Link to="/lens" className="category-overlay">
            <div className="category-overlay-bg" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071')` }}>
              <div className="category-overlay-content">
                <div className="category-label"><span className="category-icon">📸</span><h3>Indic Lens</h3></div>
                <p className="category-description">Visual stories & photo essays</p>
                <span className="explore-link">Explore Lens →</span>
              </div>
            </div>
          </Link>
          <Link to="/motion" className="category-overlay">
            <div className="category-overlay-bg" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070')` }}>
              <div className="category-overlay-content">
                <div className="category-label"><span className="category-icon">🎬</span><h3>Indic Motion</h3></div>
                <p className="category-description">Documentaries & films</p>
                <span className="explore-link">Explore Motion →</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Share Your Story</h2>
          <p>Join our community of storytellers and make your voice heard</p>
          {currentUser ? (
            <Link to="/create-story" className="cta-button">Start Writing</Link>
          ) : (
            <div className="cta-buttons">
              <Link to="/auth" className="cta-button primary">Join Indic</Link>
              <Link to="/about" className="cta-button secondary">Learn More</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService } from '../firebase/services';
import { historicalStories } from '../data/historicalStories';
import './Home.css';

const Home = () => {
  // Use historical stories from our curated collection
  const [featuredStory] = useState(historicalStories.featured);
  const [topPicks] = useState(historicalStories.topPicks);
  const [staffPicks] = useState(historicalStories.staffPicks);
  const [publishedArticles, setPublishedArticles] = useState([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublished = async () => {
      try {
        const articles = await articleService.getPublishedArticles(6);
        setPublishedArticles(articles);
      } catch (err) {
        console.error('Error fetching published articles:', err);
      }
    };
    fetchPublished();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getReadingTime = (story) => {
    // Use pre-calculated reading time if available
    if (story.readingTime) return story.readingTime;
    // Otherwise calculate from content
    if (!story.content) return '5 min';
    const wordsPerMinute = 200;
    const words = story.content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const getCategoryLabel = (category) => {
    switch(category) {
      case 'word': return 'Indic Word';
      case 'lens': return 'Indic Lens';
      case 'motion': return 'Indic Motion';
      default: return 'Indic Word';
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'word': return '✍️';
      case 'lens': return '📸';
      case 'motion': return '🎬';
      default: return '✍️';
    }
  };

  const handleStoryClick = (storyId) => {
    // Check if it's an authentic story or a user article
    if (typeof storyId === 'string' && storyId.includes('-')) {
      // Authentic stories have IDs like 'nepal-earth-2024'
      navigate(`/photo-essay/${storyId}`);
    } else {
      // User articles from Firebase
      navigate(`/article/${storyId}`);
    }
  };

  return (
    <div className="home-container">
      {/* Featured Story Overlay */}
      {featuredStory && (
        <section className="featured-overlay">
          <div
            className="featured-background"
            style={{
              backgroundImage: featuredStory.featuredImage
                ? `url(${featuredStory.featuredImage})`
                : `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070')`
            }}
          >
            <div className="featured-overlay-content">
              <div className="featured-tag">
                {getCategoryIcon(featuredStory.category)} Featured Story
              </div>
              <h1 className="featured-overlay-title">{featuredStory.title}</h1>
              <p className="featured-overlay-excerpt">{featuredStory.excerpt}</p>
              <div className="featured-overlay-meta">
                <span className="featured-author">By {featuredStory.authorName}</span>
                <span className="featured-date">{formatDate(featuredStory.publishedAt)}</span>
                <span className="featured-reading-time">{getReadingTime(featuredStory)}</span>
              </div>
              <button
                className="featured-read-btn"
                onClick={() => handleStoryClick(featuredStory.id)}
              >
                Read Story
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Top Picks Section */}
      <section className="top-picks-section">
        <div className="section-header">
          <h2 className="section-title">Top Picks</h2>
          <p className="section-subtitle">Most read stories this week</p>
        </div>
        <div className="stories-grid">
          {topPicks.map((story, index) => (
            <article
              key={story.id}
              className="story-card"
              onClick={() => handleStoryClick(story.id)}
            >
              <div className="story-image">
                <img
                  src={story.featuredImage || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2028'}
                  alt={story.title}
                  loading="lazy"
                />
                <div className="story-category-badge">
                  {getCategoryIcon(story.category)} {getCategoryLabel(story.category)}
                </div>
              </div>
              <div className="story-content">
                <h3 className="story-title">{story.title}</h3>
                <p className="story-excerpt">{story.excerpt}</p>
                <div className="story-meta">
                  <span className="story-author">{story.authorName}</span>
                  <span className="story-date">{formatDate(story.publishedAt)}</span>
                </div>
              </div>
              {index === 0 && <div className="top-pick-badge">#1</div>}
            </article>
          ))}
        </div>
      </section>

      {/* Staff Picks Section */}
      <section className="staff-picks-section">
        <div className="section-header">
          <h2 className="section-title">Staff Picks</h2>
          <p className="section-subtitle">Stories recommended by Indic</p>
        </div>
        <div className="stories-grid">
          {staffPicks.map((story) => (
            <article
              key={story.id}
              className="story-card"
              onClick={() => handleStoryClick(story.id)}
            >
              <div className="story-image">
                <img
                  src={story.featuredImage || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2028'}
                  alt={story.title}
                  loading="lazy"
                />
                <div className="story-category-badge">
                  {getCategoryIcon(story.category)} {getCategoryLabel(story.category)}
                </div>
              </div>
              <div className="story-content">
                <h3 className="story-title">{story.title}</h3>
                <p className="story-excerpt">{story.excerpt}</p>
                <div className="story-meta">
                  <span className="story-author">{story.authorName}</span>
                  <span className="story-date">{formatDate(story.publishedAt)}</span>
                </div>
              </div>
              <div className="staff-pick-badge">
                <span>⭐</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Explore the Art of Storytelling */}
      <section className="explore-section">
        <div className="section-header">
          <h2 className="section-title">Explore the Art of Storytelling</h2>
          <p className="section-subtitle">Discover stories across different mediums</p>
        </div>
        <div className="category-overlays">
          {/* Indic Word */}
          <Link to="/word" className="category-overlay">
            <div
              className="category-overlay-bg"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2073')`
              }}
            >
              <div className="category-overlay-content">
                <div className="category-label">
                  <span className="category-icon">✍️</span>
                  <h3>Indic Word</h3>
                </div>
                <p className="category-description">Written narratives & reportage</p>
                <span className="explore-link">Explore Word →</span>
              </div>
            </div>
          </Link>

          {/* Indic Lens */}
          <Link to="/lens" className="category-overlay">
            <div
              className="category-overlay-bg"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071')`
              }}
            >
              <div className="category-overlay-content">
                <div className="category-label">
                  <span className="category-icon">📸</span>
                  <h3>Indic Lens</h3>
                </div>
                <p className="category-description">Visual stories & photo essays</p>
                <span className="explore-link">Explore Lens →</span>
              </div>
            </div>
          </Link>

          {/* Indic Motion */}
          <Link to="/motion" className="category-overlay">
            <div
              className="category-overlay-bg"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070')`
              }}
            >
              <div className="category-overlay-content">
                <div className="category-label">
                  <span className="category-icon">🎬</span>
                  <h3>Indic Motion</h3>
                </div>
                <p className="category-description">Documentaries & films</p>
                <span className="explore-link">Explore Motion →</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Published Stories from Community */}
      {publishedArticles.length > 0 && (
        <section className="community-section">
          <div className="section-header">
            <h2 className="section-title">Fresh from the Community</h2>
            <p className="section-subtitle">Latest stories published by our writers</p>
          </div>
          <div className="community-grid">
            {publishedArticles.map((article) => (
              <article
                key={article.id}
                className="community-card"
                onClick={() => navigate(`/article/${article.id}`)}
              >
                <div className="community-card-image">
                  <img
                    src={article.featuredImage || 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2028'}
                    alt={article.title}
                    loading="lazy"
                  />
                </div>
                <div className="community-card-body">
                  <span className="community-card-tag">
                    {article.tags?.[0] || getCategoryLabel(article.category).replace('Indic ', '').toUpperCase()}
                  </span>
                  <h3 className="community-card-title">{article.title}</h3>
                  <p className="community-card-excerpt">{article.excerpt}</p>
                  <span className="community-card-author">{article.authorName}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

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
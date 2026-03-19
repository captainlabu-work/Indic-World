import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { historicalStories } from '../data/historicalStories';
import { authenticStories } from '../data/authenticStories';
import './CategoryPage.css';

const CATEGORY_CONFIG = {
  word: {
    title: 'Indic Word',
    subtitle: 'Written narratives, op-eds, and reportage',
    icon: null,
    description: 'Long-form journalism and storytelling that captures the human experience through words.',
    bgImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2073'
  },
  lens: {
    title: 'Indic Lens',
    subtitle: 'Visual stories and photo essays',
    icon: null,
    description: 'Photography that tells stories — from intimate portraits to sweeping landscapes.',
    bgImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071'
  },
  motion: {
    title: 'Indic Motion',
    subtitle: 'Documentaries and films',
    icon: null,
    description: 'Moving images that document reality — short films, documentaries, and video essays.',
    bgImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070'
  }
};

const CategoryPage = ({ category }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stories, setStories] = useState([]);
  const config = CATEGORY_CONFIG[category];

  useEffect(() => {
    // Collect stories matching this category from all data sources
    const allStories = [];

    // From historical stories
    const { featured, topPicks, staffPicks, categoryFeatures } = historicalStories;
    if (featured?.category === category) allStories.push(featured);
    topPicks?.filter(s => s.category === category).forEach(s => allStories.push(s));
    staffPicks?.filter(s => s.category === category).forEach(s => allStories.push(s));
    if (categoryFeatures?.[category]) allStories.push(categoryFeatures[category]);

    // From authentic stories
    const auth = authenticStories;
    if (auth.featured?.category === category) allStories.push(auth.featured);
    auth.topPicks?.filter(s => s.category === category).forEach(s => allStories.push(s));
    auth.staffPicks?.filter(s => s.category === category).forEach(s => allStories.push(s));

    // Deduplicate by ID
    const unique = [];
    const seen = new Set();
    for (const s of allStories) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        unique.push(s);
      }
    }

    setStories(unique);
  }, [category]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleStoryClick = (storyId) => {
    if (typeof storyId === 'string' && storyId.includes('-')) {
      navigate(`/photo-essay/${storyId}`);
    } else {
      navigate(`/article/${storyId}`);
    }
  };

  if (!config) return null;

  const featuredStory = stories[0];
  const restStories = stories.slice(1);

  return (
    <div className="category-page">
      {/* Hero */}
      <section className="cp-hero">
        <div
          className="cp-hero-bg"
          style={{ backgroundImage: `url(${config.bgImage})` }}
        >
          <div className="cp-hero-overlay">
            <h1 className="cp-hero-title">{config.title}</h1>
            <p className="cp-hero-subtitle">{config.subtitle}</p>
            <p className="cp-hero-desc">{config.description}</p>
            {currentUser && (
              <Link
                to={`/create-story?category=${category}`}
                className="cp-create-btn"
              >
                {category === 'motion' ? 'Upload Video' : 'Create Story'}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Featured Story */}
      {featuredStory && (
        <section className="cp-featured">
          <div className="cp-section-header">
            <h2>Featured</h2>
          </div>
          <article
            className="cp-featured-card"
            onClick={() => handleStoryClick(featuredStory.id)}
          >
            <div className="cp-featured-image">
              <img
                src={featuredStory.featuredImage}
                alt={featuredStory.title}
                loading="lazy"
              />
            </div>
            <div className="cp-featured-content">
              <h3>{featuredStory.title}</h3>
              <p className="cp-featured-excerpt">{featuredStory.excerpt}</p>
              <div className="cp-featured-meta">
                <span className="cp-author">{featuredStory.authorName}</span>
                <span className="cp-date">{formatDate(featuredStory.publishedAt)}</span>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* All Stories Grid */}
      {restStories.length > 0 && (
        <section className="cp-stories">
          <div className="cp-section-header">
            <h2>All Stories</h2>
          </div>
          <div className="cp-grid">
            {restStories.map(story => (
              <article
                key={story.id}
                className="cp-card"
                onClick={() => handleStoryClick(story.id)}
              >
                <div className="cp-card-image">
                  <img
                    src={story.featuredImage || config.bgImage}
                    alt={story.title}
                    loading="lazy"
                  />
                </div>
                <div className="cp-card-content">
                  <h3>{story.title}</h3>
                  <p>{story.excerpt}</p>
                  <div className="cp-card-meta">
                    <span className="cp-author">{story.authorName}</span>
                    <span className="cp-date">{formatDate(story.publishedAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {stories.length === 0 && (
        <section className="cp-empty">
          <h2>No stories yet</h2>
          <p>Be the first to share a story in {config.title}.</p>
          {currentUser && (
            <Link to={`/create-story?category=${category}`} className="cp-create-btn">
              {category === 'motion' ? 'Upload Video' : 'Create Story'}
            </Link>
          )}
        </section>
      )}

      {/* CTA */}
      <section className="cp-cta">
        <h2>Have a story to tell?</h2>
        <p>Join the {config.title} community and share your perspective.</p>
        {currentUser ? (
          <Link to={`/create-story?category=${category}`} className="cp-cta-btn">
            Start Creating
          </Link>
        ) : (
          <Link to="/auth" className="cp-cta-btn">
            Join Indic
          </Link>
        )}
      </section>
    </div>
  );
};

export default CategoryPage;

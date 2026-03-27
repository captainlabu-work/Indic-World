import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService } from '../firebase/services';
import './CategoryPage.css';

const CATEGORY_CONFIG = {
  word: {
    title: 'Indic Word',
    subtitle: 'Written narratives, op-eds, and reportage',
    description: 'Long-form journalism and storytelling that captures the human experience through words.',
    bgImage: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2073'
  },
  lens: {
    title: 'Indic Lens',
    subtitle: 'Visual stories and photo essays',
    description: 'Photography that tells stories — from intimate portraits to sweeping landscapes.',
    bgImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071'
  },
  motion: {
    title: 'Indic Motion',
    subtitle: 'Documentaries and films',
    description: 'Moving images that document reality — short films, documentaries, and video essays.',
    bgImage: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070'
  }
};

const CategoryPage = ({ category }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const config = CATEGORY_CONFIG[category];

  useEffect(() => {
    const loadStories = async () => {
      setLoading(true);
      try {
        const articles = await articleService.getPublishedArticlesByCategory(category, 20);
        setStories(articles);
      } catch (err) {
        console.error('Error fetching articles:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStories();
  }, [category]);

  const getFirstTag = (story) => {
    if (story.tags && story.tags.length > 0) return story.tags[0];
    return config.title.replace('Indic ', '').toUpperCase();
  };

  if (!config) return null;

  const coverStory = stories[0];
  const gridStories = stories.slice(1);

  return (
    <div className="category-page">
      {/* Header Bar */}
      <div className="cp-header-bar">
        <h1 className="cp-header-title">{config.title}</h1>
        <p className="cp-header-sub">{config.subtitle}</p>
        {currentUser && (
          <Link to={`/create-story?category=${category}`} className="cp-create-btn">
            {category === 'motion' ? 'Upload Video' : 'Create Story'}
          </Link>
        )}
      </div>

      {loading ? (
        <div className="cp-loading">
          <div className="cp-spinner"></div>
          <p>Loading stories...</p>
        </div>
      ) : stories.length === 0 ? (
        <section className="cp-empty">
          <h2>No work published here yet.</h2>
          <p>Be the first to share a story in {config.title}.</p>
          {currentUser && (
            <Link to={`/create-story?category=${category}`} className="cp-create-btn">
              {category === 'motion' ? 'Upload Video' : 'Create Story'}
            </Link>
          )}
        </section>
      ) : (
        <div className="cp-content">
          {/* Cover Story */}
          {coverStory && (
            <section className="cp-cover" onClick={() => navigate(`/article/${coverStory.id}`)}>
              <div className="cp-cover-image">
                <img
                  src={coverStory.featuredImage || config.bgImage}
                  alt={coverStory.title}
                />
                {coverStory.publicDomainVerified && <span className="pd-badge">PD</span>}
              </div>
              <div className="cp-cover-info">
                <span className="cp-tag">{getFirstTag(coverStory)}</span>
                <h2 className="cp-cover-title">{coverStory.title}</h2>
              </div>
            </section>
          )}

          {/* Story Grid */}
          {gridStories.length > 0 && (
            <section className="cp-grid-section">
              <div className="cp-grid">
                {gridStories.map(story => (
                  <article
                    key={story.id}
                    className="cp-card"
                    onClick={() => navigate(`/article/${story.id}`)}
                  >
                    <div className="cp-card-image">
                      <img
                        src={story.featuredImage || config.bgImage}
                        alt={story.title}
                        loading="lazy"
                      />
                      {story.publicDomainVerified && <span className="pd-badge">PD</span>}
                    </div>
                    <div className="cp-card-body">
                      <span className="cp-tag">{getFirstTag(story)}</span>
                      <h3 className="cp-card-title">{story.title}</h3>
                      <span className="cp-card-author">{story.authorName}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
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

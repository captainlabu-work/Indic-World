import { useState, useEffect, useRef, useCallback } from 'react';
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

// Detect mobile/touch devices for disabling hover preview
const isTouchDevice = () =>
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

// Play icon SVG for Motion cards
const PlayIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="motion-play-svg">
    <circle cx="24" cy="24" r="23" stroke="white" strokeWidth="2" fill="rgba(0,0,0,0.4)" />
    <polygon points="19,15 19,33 35,24" fill="white" />
  </svg>
);

// Motion card with hover video preview (desktop only)
const MotionCard = ({ story, config, navigate, getFirstTag }) => {
  const videoRef = useRef(null);
  const hoverTimer = useRef(null);
  const [previewing, setPreviewing] = useState(false);
  const isTouch = useRef(isTouchDevice());

  const handleMouseEnter = useCallback(() => {
    if (isTouch.current || !story.content) return;
    hoverTimer.current = setTimeout(() => {
      setPreviewing(true);
    }, 400);
  }, [story.content]);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setPreviewing(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    if (previewing && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [previewing]);

  useEffect(() => {
    return () => clearTimeout(hoverTimer.current);
  }, []);

  return (
    <article
      className="cp-card cp-card--motion"
      onClick={() => navigate(`/motion/${story.id}`)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cp-card-image cp-card-image--motion">
        <img
          src={story.featuredImage || config.bgImage}
          alt={story.title}
          loading="lazy"
          className={previewing ? 'motion-thumb-hidden' : ''}
        />
        {previewing && story.content && (
          <video
            ref={videoRef}
            src={story.content}
            className="motion-preview-video"
            muted
            playsInline
            loop
          />
        )}
        <div className={`motion-card-overlay ${previewing ? 'motion-card-overlay--hidden' : ''}`}>
          <PlayIcon />
        </div>
        {story.motionType && (
          <span className="motion-type-badge">{story.motionType}</span>
        )}
      </div>
      <div className="cp-card-body">
        <span className="cp-tag">{getFirstTag(story)}</span>
        <h3 className="cp-card-title">{story.title}</h3>
        <span className="cp-card-author" onClick={(e) => { e.stopPropagation(); navigate(`/author/${story.authorId}`); }}>{story.authorName}</span>
      </div>
    </article>
  );
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

  const isMotion = category === 'motion';
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
        <div className={`cp-content ${isMotion ? 'cp-content--motion' : ''}`}>
          {/* Cover Story */}
          {coverStory && (
            <section
              className={`cp-cover ${isMotion ? 'cp-cover--motion' : ''}`}
              onClick={() => navigate(isMotion ? `/motion/${coverStory.id}` : `/article/${coverStory.id}`)}
            >
              <div className={`cp-cover-image ${isMotion ? 'cp-cover-image--motion' : ''}`}>
                <img
                  src={coverStory.featuredImage || config.bgImage}
                  alt={coverStory.title}
                />
                {coverStory.publicDomainVerified && <span className="pd-badge">PD</span>}
                {isMotion && (
                  <div className="motion-cover-overlay">
                    <PlayIcon />
                    {coverStory.motionType && (
                      <span className="motion-type-badge motion-type-badge--cover">{coverStory.motionType}</span>
                    )}
                  </div>
                )}
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
              <div className={`cp-grid ${isMotion ? 'cp-grid--motion' : ''}`}>
                {gridStories.map(story =>
                  isMotion ? (
                    <MotionCard
                      key={story.id}
                      story={story}
                      config={config}
                      navigate={navigate}
                      getFirstTag={getFirstTag}
                    />
                  ) : (
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
                        <span className="cp-card-author" onClick={(e) => { e.stopPropagation(); navigate(`/author/${story.authorId}`); }}>{story.authorName}</span>
                      </div>
                    </article>
                  )
                )}
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

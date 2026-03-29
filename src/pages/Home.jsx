import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService } from '../firebase/services';
import './Home.css';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2028';

const PLACEHOLDER_CARDS = Array.from({ length: 4 }, (_, i) => ({
  id: `placeholder-${i}`,
  placeholder: true,
  title: 'Coming Soon',
  featuredImage: null,
}));

/* ── Horizontal Scroll Row ── */
const ScrollRow = ({ title, items, navigate, getCategoryLabel }) => {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll, items]);

  const scroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector('.scroll-card');
    if (!card) return;
    const cardWidth = card.offsetWidth + parseInt(getComputedStyle(el).gap || '0');
    el.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
  };

  return (
    <section className="picks-section">
      <div className="picks-header">
        <h2 className="picks-title">{title}</h2>
        <div className="picks-arrows">
          <button
            className={`picks-arrow ${!canScrollLeft ? 'disabled' : ''}`}
            onClick={() => scroll(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className={`picks-arrow ${!canScrollRight ? 'disabled' : ''}`}
            onClick={() => scroll(1)}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="picks-track" ref={trackRef}>
        {items.map((item) => (
          <article
            key={item.id}
            className={`scroll-card ${item.placeholder ? 'scroll-card--placeholder' : ''}`}
            onClick={() => !item.placeholder && navigate(`/article/${item.id}`)}
          >
            <div className="scroll-card-image">
              {item.placeholder ? (
                <div className="scroll-card-placeholder-bg" />
              ) : (
                <img
                  src={item.featuredImage || PLACEHOLDER_IMAGE}
                  alt={item.title}
                  loading="lazy"
                />
              )}
            </div>
            <div className="scroll-card-body">
              {!item.placeholder && (
                <span className="home-tag">
                  {item.tags?.[0] || getCategoryLabel(item.category)}
                </span>
              )}
              <h3 className="scroll-card-title">
                {item.title}
              </h3>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

/* ── Home Page ── */
const Home = () => {
  const [publishedArticles, setPublishedArticles] = useState([]);
  const [topPicks, setTopPicks] = useState([]);
  const [staffPicks, setStaffPicks] = useState([]);
  const [coverStory, setCoverStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articles, top, staff, cover] = await Promise.all([
          articleService.getPublishedArticles(12),
          articleService.getTopPicks(10),
          articleService.getStaffPicks(10),
          articleService.getCoverStory(),
        ]);
        setPublishedArticles(articles);
        setTopPicks(top);
        setStaffPicks(staff);
        setCoverStory(cover);
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'word': return 'WORD';
      case 'lens': return 'LENS';
      case 'motion': return 'MOTION';
      default: return 'WORD';
    }
  };

  // Cover story: use admin-selected, or fallback to latest published
  const featuredArticle = coverStory || publishedArticles[0] || null;
  const featuredFocalX = coverStory?.coverFocalX ?? 50;
  const featuredFocalY = coverStory?.coverFocalY ?? 50;
  // Grid: exclude the featured article from the list
  const gridArticles = publishedArticles.filter(a => a.id !== featuredArticle?.id);

  // Top Picks: show placeholders if empty
  const topPicksDisplay = topPicks.length > 0 ? topPicks : PLACEHOLDER_CARDS;

  // Staff Picks: if none marked, fallback to latest published (limit 4)
  const staffPicksDisplay = staffPicks.length > 0
    ? staffPicks
    : publishedArticles.slice(0, 4);

  return (
    <div className="home-container">
      {/* Featured Article */}
      {!loading && featuredArticle && (
        <section className="home-featured" onClick={() => navigate(`/article/${featuredArticle.id}`)}>
          <div className="home-featured-image">
            <img
              src={featuredArticle.featuredImage || PLACEHOLDER_IMAGE}
              alt={featuredArticle.title}
              style={{ objectPosition: `${featuredFocalX}% ${featuredFocalY}%` }}
            />
            {featuredArticle.publicDomainVerified && <span className="pd-badge">PD</span>}
          </div>
          <div className="home-featured-info">
            <span className="home-tag">{featuredArticle.tags?.[0] || getCategoryLabel(featuredArticle.category)}</span>
            <h2 className="home-featured-title">{featuredArticle.title}</h2>
            {featuredArticle.excerpt && <p className="home-featured-excerpt">{featuredArticle.excerpt}</p>}
            <span className="home-featured-author">{featuredArticle.authorName}</span>
          </div>
        </section>
      )}

      {/* The Latest */}
      {!loading && gridArticles.length > 0 && (
        <ScrollRow
          title="The Latest"
          items={gridArticles}
          navigate={navigate}
          getCategoryLabel={getCategoryLabel}
        />
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

      {/* Top Picks */}
      {!loading && (
        <ScrollRow
          title="Top Picks"
          items={topPicksDisplay}
          navigate={navigate}
          getCategoryLabel={getCategoryLabel}
        />
      )}

      {/* Staff Picks */}
      {!loading && staffPicksDisplay.length > 0 && (
        <ScrollRow
          title="Staff Picks"
          items={staffPicksDisplay}
          navigate={navigate}
          getCategoryLabel={getCategoryLabel}
        />
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
                <div className="category-label"><span className="category-icon">&#x270D;&#xFE0F;</span><h3>Indic Word</h3></div>
                <p className="category-description">Written narratives & reportage</p>
                <span className="explore-link">Explore Word &rarr;</span>
              </div>
            </div>
          </Link>
          <Link to="/lens" className="category-overlay">
            <div className="category-overlay-bg" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071')` }}>
              <div className="category-overlay-content">
                <div className="category-label"><span className="category-icon">&#x1F4F8;</span><h3>Indic Lens</h3></div>
                <p className="category-description">Visual stories & photo essays</p>
                <span className="explore-link">Explore Lens &rarr;</span>
              </div>
            </div>
          </Link>
          <Link to="/motion" className="category-overlay">
            <div className="category-overlay-bg" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070')` }}>
              <div className="category-overlay-content">
                <div className="category-label"><span className="category-icon">&#x1F3AC;</span><h3>Indic Motion</h3></div>
                <p className="category-description">Documentaries & films</p>
                <span className="explore-link">Explore Motion &rarr;</span>
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

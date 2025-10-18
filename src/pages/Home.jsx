import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { publicDomainStories } from '../data/publicDomainStories';
import './Home.css';

const Home = () => {
  // Use public domain stories from our curated collection
  const [featuredStory, setFeaturedStory] = useState(publicDomainStories.featured);
  const [topPicks, setTopPicks] = useState(publicDomainStories.topPicks);
  const [staffPicks, setStaffPicks] = useState(publicDomainStories.staffPicks);
  const [categoryFeatures, setCategoryFeatures] = useState(publicDomainStories.categoryFeatures);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: Fetch any real published articles from Firebase to mix with authentic stories
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'articles'),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        const publishedArticles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (publishedArticles.length > 0) {
          // You can mix real user-generated articles with authentic stories
          // For now, we're using our curated authentic stories

          // Optionally mix user articles with our curated content
          // For now, we're prioritizing authentic stories
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching articles:', error);
        // Keep fake data on error
        setLoading(false);
      }
    );

    return () => unsubscribe();
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

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
          <div
            className="category-overlay"
            onClick={() => categoryFeatures.word && handleStoryClick(categoryFeatures.word.id)}
          >
            <div
              className="category-overlay-bg"
              style={{
                backgroundImage: categoryFeatures.word?.featuredImage
                  ? `url(${categoryFeatures.word.featuredImage})`
                  : `url('https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=2073')`
              }}
            >
              <div className="category-overlay-content">
                <div className="category-label">
                  <span className="category-icon">✍️</span>
                  <h3>Indic Word</h3>
                </div>
                <p className="category-description">Written narratives & reportage</p>
                {categoryFeatures.word && (
                  <div className="category-featured">
                    <h4>{categoryFeatures.word.title}</h4>
                    <p>{categoryFeatures.word.excerpt}</p>
                  </div>
                )}
                <Link to="/stories?category=word" className="explore-link">
                  Explore Word →
                </Link>
              </div>
            </div>
          </div>

          {/* Indic Lens */}
          <div
            className="category-overlay"
            onClick={() => categoryFeatures.lens && handleStoryClick(categoryFeatures.lens.id)}
          >
            <div
              className="category-overlay-bg"
              style={{
                backgroundImage: categoryFeatures.lens?.featuredImage
                  ? `url(${categoryFeatures.lens.featuredImage})`
                  : `url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=2071')`
              }}
            >
              <div className="category-overlay-content">
                <div className="category-label">
                  <span className="category-icon">📸</span>
                  <h3>Indic Lens</h3>
                </div>
                <p className="category-description">Visual stories & photo essays</p>
                {categoryFeatures.lens && (
                  <div className="category-featured">
                    <h4>{categoryFeatures.lens.title}</h4>
                    <p>{categoryFeatures.lens.excerpt}</p>
                  </div>
                )}
                <Link to="/stories?category=lens" className="explore-link">
                  Explore Lens →
                </Link>
              </div>
            </div>
          </div>

          {/* Indic Motion */}
          <div
            className="category-overlay"
            onClick={() => categoryFeatures.motion && handleStoryClick(categoryFeatures.motion.id)}
          >
            <div
              className="category-overlay-bg"
              style={{
                backgroundImage: categoryFeatures.motion?.featuredImage
                  ? `url(${categoryFeatures.motion.featuredImage})`
                  : `url('https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070')`
              }}
            >
              <div className="category-overlay-content">
                <div className="category-label">
                  <span className="category-icon">🎬</span>
                  <h3>Indic Motion</h3>
                </div>
                <p className="category-description">Documentaries & films</p>
                {categoryFeatures.motion && (
                  <div className="category-featured">
                    <h4>{categoryFeatures.motion.title}</h4>
                    <p>{categoryFeatures.motion.excerpt}</p>
                  </div>
                )}
                <Link to="/stories?category=motion" className="explore-link">
                  Explore Motion →
                </Link>
              </div>
            </div>
          </div>
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
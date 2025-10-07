import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

const Home = () => {
  // Fake featured story for demo
  const fakeFeaturedStory = {
    id: 'featured-1',
    title: 'The Last Storytellers of Kashmir',
    excerpt: 'In the heart of the Himalayas, ancient oral traditions face extinction as modernization threatens to silence voices that have echoed through valleys for centuries.',
    content: 'A long form story about the traditional storytellers...',
    featuredImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2071',
    category: 'word',
    authorName: 'Aisha Sharma',
    authorId: 'author-1',
    publishedAt: { toDate: () => new Date() },
    views: 1250
  };

  const [featuredStory, setFeaturedStory] = useState(fakeFeaturedStory);
  const [topPicks, setTopPicks] = useState([]);
  const [staffPicks, setStaffPicks] = useState([]);
  const [categoryFeatures, setCategoryFeatures] = useState({
    word: null,
    lens: null,
    motion: null
  });
  const [loading, setLoading] = useState(false); // Set to false since we have fake data
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fake stories for demo
  const fakeTopPicks = [
    {
      id: 'top-1',
      title: 'Streets of Old Delhi: A Photo Essay',
      excerpt: 'Capturing the essence of centuries-old bazaars through the lens of modern storytelling.',
      featuredImage: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=2071',
      category: 'lens',
      authorName: 'Raj Patel',
      publishedAt: { toDate: () => new Date() }
    },
    {
      id: 'top-2',
      title: 'The Monsoon Diaries',
      excerpt: 'A filmmaker\'s journey documenting the transformation of rural India during the rains.',
      featuredImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?q=80&w=2076',
      category: 'motion',
      authorName: 'Maya Krishnan',
      publishedAt: { toDate: () => new Date() }
    },
    {
      id: 'top-3',
      title: 'Forgotten Temples of the South',
      excerpt: 'Exploring architectural marvels hidden in the Western Ghats.',
      featuredImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?q=80&w=2070',
      category: 'word',
      authorName: 'Arjun Nair',
      publishedAt: { toDate: () => new Date() }
    },
    {
      id: 'top-4',
      title: 'The Spice Route Revival',
      excerpt: 'How ancient trade paths are inspiring modern culinary adventures.',
      featuredImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070',
      category: 'word',
      authorName: 'Priya Mehta',
      publishedAt: { toDate: () => new Date() }
    }
  ];

  const fakeStaffPicks = [
    {
      id: 'staff-1',
      title: 'Voices from the Sundarbans',
      excerpt: 'Stories of resilience from the world\'s largest mangrove forest.',
      featuredImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=2070',
      category: 'word',
      authorName: 'Ananya Das',
      publishedAt: { toDate: () => new Date() }
    },
    {
      id: 'staff-2',
      title: 'The Dance of Democracy',
      excerpt: 'A visual journey through India\'s electoral process.',
      featuredImage: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=2076',
      category: 'lens',
      authorName: 'Vikram Singh',
      publishedAt: { toDate: () => new Date() }
    },
    {
      id: 'staff-3',
      title: 'Himalayan Echoes',
      excerpt: 'A documentary on the changing soundscapes of mountain communities.',
      featuredImage: 'https://images.unsplash.com/photo-1586611292717-f828b167408c?q=80&w=2074',
      category: 'motion',
      authorName: 'Tenzin Norbu',
      publishedAt: { toDate: () => new Date() }
    },
    {
      id: 'staff-4',
      title: 'The Cotton Chronicles',
      excerpt: 'From field to fabric: The untold stories of Indian textile workers.',
      featuredImage: 'https://images.unsplash.com/photo-1605630662224-cac4dfa4f668?q=80&w=2070',
      category: 'word',
      authorName: 'Fatima Ahmed',
      publishedAt: { toDate: () => new Date() }
    }
  ];

  useEffect(() => {
    // Set fake data initially
    setTopPicks(fakeTopPicks);
    setStaffPicks(fakeStaffPicks);

    // Set category features with fake data
    setCategoryFeatures({
      word: fakeTopPicks.find(s => s.category === 'word') || fakeStaffPicks[0],
      lens: fakeTopPicks.find(s => s.category === 'lens') || fakeStaffPicks[1],
      motion: fakeTopPicks.find(s => s.category === 'motion') || fakeStaffPicks[2]
    });

    // Fetch published articles (will override fake data when available)
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
          // Set featured story (most recent)
          setFeaturedStory(publishedArticles[0]);

          // Set top picks (most viewed - simulated for now, next 4 stories)
          setTopPicks(publishedArticles.slice(1, 5));

          // Set staff picks (next 4 stories)
          setStaffPicks(publishedArticles.slice(5, 9));

          // Set category features
          const wordArticles = publishedArticles.filter(a => !a.category || a.category === 'word');
          const lensArticles = publishedArticles.filter(a => a.category === 'lens');
          const motionArticles = publishedArticles.filter(a => a.category === 'motion');

          setCategoryFeatures({
            word: wordArticles[0] || fakeTopPicks.find(s => s.category === 'word'),
            lens: lensArticles[0] || fakeTopPicks.find(s => s.category === 'lens'),
            motion: motionArticles[0] || fakeTopPicks.find(s => s.category === 'motion')
          });
        } else {
          // If no articles from database, keep fake data
          console.log('Using demo content - no published articles found');
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

  const getReadingTime = (content) => {
    if (!content) return '5 min';
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
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

  const handleStoryClick = (articleId) => {
    navigate(`/article/${articleId}`);
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
                <span className="featured-reading-time">{getReadingTime(featuredStory.content)}</span>
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
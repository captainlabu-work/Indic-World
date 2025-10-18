import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStoryById, getStoriesByCategory } from '../data/publicDomainStories';
import './PhotoEssay.css';

// Helper function to format date
const formatStoryDate = (date) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const PhotoEssay = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [relatedStories, setRelatedStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the story by ID
    const currentStory = getStoryById(storyId);

    if (currentStory) {
      setStory(currentStory);

      // Get related stories from the same category
      const related = getStoriesByCategory(currentStory.category)
        .filter(s => s.id !== storyId)
        .slice(0, 3);
      setRelatedStories(related);
    } else {
      // Story not found, redirect to home
      navigate('/');
    }

    setLoading(false);

    // Scroll to top when story changes
    window.scrollTo(0, 0);
  }, [storyId, navigate]);

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'word': return '✍️';
      case 'lens': return '📸';
      case 'motion': return '🎬';
      default: return '✍️';
    }
  };

  const getCategoryLabel = (category) => {
    switch(category) {
      case 'word': return 'INDIC WORD';
      case 'lens': return 'INDIC LENS';
      case 'motion': return 'INDIC MOTION';
      default: return 'STORY';
    }
  };

  const getReadingTime = (story) => {
    // Use pre-calculated reading time if available
    if (story.readingTime) return story.readingTime;
    // Otherwise calculate from content
    if (!story.content) return '5 min read';
    const wordsPerMinute = 200;
    const words = story.content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const renderContent = (content) => {
    // Split content into paragraphs
    const paragraphs = content.split('\n\n');

    return paragraphs.map((paragraph, index) => {
      // Check if this is a quote (starts and ends with quotes)
      if (paragraph.trim().startsWith('"') && paragraph.trim().endsWith('"')) {
        return (
          <div key={index} className="essay-quote">
            <div className="essay-quote-text">
              {paragraph.trim().slice(1, -1)}
            </div>
          </div>
        );
      }

      // Regular paragraph
      return (
        <p key={index} className="essay-text">
          {paragraph}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!story) {
    return null;
  }

  return (
    <div className="photo-essay-container">
      {/* Hero Section */}
      <section className="essay-hero">
        <img
          src={story.featuredImage}
          alt={story.title}
          className="essay-hero-image"
        />
        <div className="essay-hero-overlay">
          <div className="essay-category-tag">
            {getCategoryIcon(story.category)} {getCategoryLabel(story.category)}
          </div>
          <h1 className="essay-title">{story.title}</h1>
          <p className="essay-subtitle">{story.excerpt}</p>
        </div>
      </section>

      {/* Metadata Bar */}
      <div className="essay-metadata">
        <div className="essay-author-info">
          <div className="essay-author-avatar">
            {story.authorName.charAt(0)}
          </div>
          <div className="essay-author-details">
            <a href="#" className="essay-author-name">{story.authorName}</a>
            <span className="essay-date">
              {formatStoryDate(story.publishedAt.toDate())}
            </span>
          </div>
        </div>

        <div className="essay-meta-item">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
          </svg>
          {story.views || Math.floor(Math.random() * 5000 + 1000)} views
        </div>

        <div className="essay-meta-item">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
          </svg>
          {getReadingTime(story)}
        </div>

        {story.license && (
          <div className="essay-license">
            {story.license}
          </div>
        )}
      </div>

      {/* Essay Content */}
      <article className="essay-content">
        {story.content && (
          <div className="essay-lead">
            {story.excerpt}
          </div>
        )}

        {renderContent(story.content)}

        {/* Additional Images (if available) */}
        {story.images && story.images.length > 0 && (
          <div className="photo-grid">
            {story.images.map((imageUrl, index) => (
              <div key={index} className="photo-item">
                <img src={imageUrl} alt={`${story.title} - Photo ${index + 1}`} />
                <div className="photo-caption">
                  {story.title} - Historical Documentation
                  {story.credits && (
                    <span className="photo-credit"> • {story.credits}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* Essay Footer */}
      <footer className="essay-footer">
        {/* Source Information */}
        {story.source && (
          <div className="essay-source-info">
            <div className="essay-source-title">Source & Attribution</div>
            <div className="essay-source-details">
              <strong>Source:</strong> {story.source}<br />
              {story.license && (
                <>
                  <strong>License:</strong> {story.license}<br />
                </>
              )}
              {story.credits && (
                <>
                  <strong>Credits:</strong> {story.credits}<br />
                </>
              )}
              {story.originalUrl && (
                <>
                  <strong>Original:</strong> <a href={story.originalUrl} target="_blank" rel="noopener noreferrer" className="essay-source-link">View original source</a>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="essay-tags">
          {story.tags && story.tags.map(tag => (
            <a key={tag} href={`/stories?tag=${tag}`} className="essay-tag">
              {tag}
            </a>
          ))}
        </div>

        {/* Related Stories */}
        {relatedStories.length > 0 && (
          <div className="related-stories">
            <h3 className="related-stories-title">Related Stories</h3>
            <div className="related-stories-grid">
              {relatedStories.map(relatedStory => (
                <div
                  key={relatedStory.id}
                  className="related-story-card"
                  onClick={() => navigate(`/photo-essay/${relatedStory.id}`)}
                >
                  <img
                    src={relatedStory.featuredImage}
                    alt={relatedStory.title}
                    className="related-story-image"
                  />
                  <h4 className="related-story-title">{relatedStory.title}</h4>
                  <p className="related-story-author">By {relatedStory.authorName}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default PhotoEssay;
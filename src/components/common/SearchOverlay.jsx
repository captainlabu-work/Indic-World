import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../firebase/services';
import './SearchOverlay.css';

const SearchOverlay = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [stories, setStories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setStories([]);
      setAuthors([]);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSearch = (value) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setStories([]);
      setAuthors([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [storyResults, userResults] = await Promise.all([
          searchService.searchArticles(value, 8),
          searchService.searchUsers(value, 5)
        ]);
        setStories(storyResults);
        setAuthors(userResults);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const goToStory = (id, category) => {
    onClose();
    navigate(category === 'motion' ? `/motion/${id}` : `/article/${id}`);
  };

  const goToAuthor = (uid) => {
    onClose();
    navigate(`/author/${uid}`);
  };

  if (!isOpen) return null;

  const hasResults = stories.length > 0 || authors.length > 0;
  const hasQuery = query.trim().length > 0;

  return (
    <div className="search-overlay">
      <div className="search-backdrop" onClick={onClose} />
      <div className="search-modal">
        {/* Search Input */}
        <div className="search-input-row">
          <svg className="search-input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search stories or authors..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <button className="search-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Results */}
        <div className="search-results">
          {loading && (
            <div className="search-loading">Searching...</div>
          )}

          {!loading && hasQuery && !hasResults && (
            <div className="search-empty">No results found</div>
          )}

          {!loading && !hasQuery && (
            <div className="search-hint">Start typing to search stories and authors</div>
          )}

          {/* Stories */}
          {stories.length > 0 && (
            <div className="search-section">
              <h4 className="search-section-title">Stories</h4>
              {stories.map(story => (
                <div key={story.id} className="search-result-item" onClick={() => goToStory(story.id, story.category)}>
                  {story.featuredImage && (
                    <div className="search-result-thumb">
                      <img src={story.featuredImage} alt="" />
                    </div>
                  )}
                  <div className="search-result-info">
                    <span className="search-result-title">{story.title}</span>
                    <span className="search-result-meta">by {story.authorName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Authors */}
          {authors.length > 0 && (
            <div className="search-section">
              <h4 className="search-section-title">Authors</h4>
              {authors.map(author => (
                <div key={author.id} className="search-result-item" onClick={() => goToAuthor(author.uid)}>
                  <div className="search-result-avatar">
                    {author.photoURL ? (
                      <img src={author.photoURL} alt="" />
                    ) : (
                      <span className="search-avatar-fallback">
                        {(author.displayName || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="search-result-info">
                    <span className="search-result-title">{author.displayName}</span>
                    <span className="search-result-meta">Author</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;

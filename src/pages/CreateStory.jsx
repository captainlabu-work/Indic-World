import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService, storageService } from '../firebase/services';
import { useNotification } from '../components/common/NotificationSystem';
import RichTextEditor from '../components/RichTextEditor';
import VisualStoryEditor from '../components/VisualStoryEditor';
import './CreateStory.css';

const CreateStory = () => {
  const { currentUser, userData } = useAuth();
  const { success, error: showError, showConfirmation } = useNotification();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: '',
    category: 'word' // Default to Indic Word
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('File must be an image');
        return;
      }
      setFeaturedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };


  const handleDiscard = async () => {
    const hasContent = formData.title || formData.excerpt || formData.content;

    if (hasContent) {
      const confirmed = await showConfirmation({
        title: 'Discard Changes?',
        message: 'Are you sure you want to discard this story? All unsaved changes will be lost.',
        confirmText: 'Discard',
        cancelText: 'Keep Writing',
        type: 'warning'
      });

      if (confirmed) {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e, status = 'draft') => {
    e.preventDefault();

    // Check if user is authenticated
    if (!currentUser) {
      showError('You must be logged in to create a story');
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = '';

      // Upload image if present
      if (featuredImage) {
        try {
          imageUrl = await storageService.uploadImage(featuredImage, `articles/${Date.now()}_${featuredImage.name}`);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          setError('Failed to upload image. Please try again or continue without an image.');
          // Continue without image instead of failing completely
          imageUrl = '';
        }
      }

      // Prepare article data
      const articleData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        featuredImage: imageUrl,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email,
        status: status,
        views: 0
      };

      // Create article
      await articleService.createArticle(articleData);

      // Redirect based on status
      if (status === 'pending') {
        success('Story submitted for review!');
      } else {
        success('Story saved as draft!');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating article:', err);

      // Provide more specific error messages
      if (err.message?.includes('permission')) {
        showError('Permission denied. Please make sure you are logged in and try again.');
      } else if (err.message?.includes('network')) {
        showError('Network error. Please check your connection and try again.');
      } else {
        showError(`Failed to create story: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVisualStorySave = async (storyData) => {
    if (!currentUser) {
      showError('You must be logged in to create a story');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // Prepare visual story data
      const articleData = {
        title: storyData.title || 'Untitled Story',
        excerpt: storyData.subtitle || '',
        content: JSON.stringify(storyData), // Store the visual story structure as JSON
        category: 'lens',
        featuredImage: storyData.coverImage || '',
        tags: [],
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email,
        status: 'draft',
        views: 0,
        isVisualStory: true // Flag to identify visual stories
      };

      await articleService.createArticle(articleData);
      success('Visual story saved!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating visual story:', err);
      showError('Failed to save visual story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show visual editor for Indic Lens category
  if (formData.category === 'lens') {
    return (
      <div className="create-story-container">
        <VisualStoryEditor
          onSave={handleVisualStorySave}
          initialData={null}
        />
      </div>
    );
  }

  return (
    <div className="create-story-container">
      <div className="create-story-header">
        <h1>Create Your Story</h1>
        <p className="create-story-subtitle">Share your thoughts with the world</p>
      </div>

      <form className="create-story-form">
        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <div className="category-selector">
            <label className={`category-option ${formData.category === 'word' ? 'active' : ''}`}>
              <input
                type="radio"
                name="category"
                value="word"
                checked={formData.category === 'word'}
                onChange={handleInputChange}
              />
              <span className="category-icon">✍️</span>
              <div className="category-info">
                <span className="category-name">Indic Word</span>
                <span className="category-desc">Written narratives, op-eds, reportage</span>
              </div>
            </label>
            <label className={`category-option ${formData.category === 'lens' ? 'active' : ''}`}>
              <input
                type="radio"
                name="category"
                value="lens"
                checked={formData.category === 'lens'}
                onChange={handleInputChange}
              />
              <span className="category-icon">📸</span>
              <div className="category-info">
                <span className="category-name">Indic Lens</span>
                <span className="category-desc">Photo essays, visual journalism</span>
              </div>
            </label>
            <label className={`category-option ${formData.category === 'motion' ? 'active' : ''}`}>
              <input
                type="radio"
                name="category"
                value="motion"
                checked={formData.category === 'motion'}
                onChange={handleInputChange}
              />
              <span className="category-icon">🎬</span>
              <div className="category-info">
                <span className="category-name">Indic Motion</span>
                <span className="category-desc">Documentaries, films, video stories</span>
              </div>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="title">Story Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter a compelling title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Excerpt *</label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            placeholder="Brief summary of your story (max 200 characters)"
            maxLength={200}
            rows={3}
            required
          />
          <small className="char-count">{formData.excerpt.length}/200</small>
        </div>

        <div className="form-group">
          <label htmlFor="featuredImage">Featured Image</label>
          <input
            type="file"
            id="featuredImage"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button
                type="button"
                onClick={() => {
                  setFeaturedImage(null);
                  setImagePreview(null);
                }}
                className="remove-image-btn"
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="content">Story Content *</label>
          <RichTextEditor
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Write your story here...

Use markdown formatting:
- **bold** for bold text
- *italic* for italic text
- # Heading 1, ## Heading 2, ### Heading 3
- - List item for bullet points
- > Quote for blockquotes
- [text](url) for links
- `code` for inline code"
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (Optional)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder="Enter tags separated by commas (e.g., travel, photography, life)"
          />
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={handleDiscard}
            className="discard-btn"
            disabled={loading}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            className="draft-btn"
            disabled={loading || !formData.title || !formData.excerpt || !formData.content}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'pending')}
            className="submit-btn"
            disabled={loading || !formData.title || !formData.excerpt || !formData.content}
          >
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStory;

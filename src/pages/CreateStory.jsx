import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService, storageService } from '../firebase/services';
import { useNotification } from '../components/common/NotificationSystem';
import StoryEditor from '../components/StoryEditor';
import './CreateStory.css';

const CreateStory = () => {
  const { currentUser, userData } = useAuth();
  const { success, error: showError, showConfirmation } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get category from URL param (?category=word) or default to 'word'
  const urlCategory = searchParams.get('category') || 'word';
  const [category, setCategory] = useState(urlCategory);

  // Motion-specific state (direct upload form)
  const [motionData, setMotionData] = useState({
    title: '',
    excerpt: '',
    tags: '',
    videoFile: null
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // === Story Editor save handler (for Word & Lens) ===
  const handleEditorSave = async (storyData, status = 'pending') => {
    if (!currentUser) {
      showError('You must be logged in to create a story');
      navigate('/auth');
      return;
    }

    try {
      const articleData = {
        title: storyData.title || 'Untitled Story',
        excerpt: storyData.subtitle || '',
        content: JSON.stringify(storyData),
        category: storyData.category || category,
        featuredImage: storyData.coverImage || '',
        tags: [],
        authorId: currentUser.uid,
        authorName: storyData.authorName || userData?.displayName || currentUser.email,
        status,
        views: 0,
        isVisualStory: true
      };

      await articleService.createArticle(articleData);

      if (status === 'pending') {
        success('Story submitted for review!');
      } else {
        success('Story saved as draft!');
      }
      navigate('/profile');
    } catch (err) {
      console.error('Error creating story:', err);
      showError(`Failed to save story: ${err.message || 'Unknown error'}`);
    }
  };

  const handleEditorPublish = (storyData) => handleEditorSave(storyData, 'pending');
  const handleEditorDraft = (storyData) => handleEditorSave(storyData, 'draft');

  // === Motion form handlers ===
  const handleMotionInputChange = (e) => {
    const { name, value } = e.target;
    setMotionData(prev => ({ ...prev, [name]: value }));
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

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        setError('Video must be less than 100MB');
        return;
      }
      setMotionData(prev => ({ ...prev, videoFile: file }));
      setError('');
    }
  };

  const handleMotionSubmit = async (status = 'draft') => {
    if (!currentUser) {
      showError('You must be logged in to create a story');
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let imageUrl = '';
      let videoUrl = '';

      if (featuredImage) {
        try {
          imageUrl = await storageService.uploadImage(featuredImage, `articles/${Date.now()}_${featuredImage.name}`);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          imageUrl = '';
        }
      }

      if (motionData.videoFile) {
        try {
          videoUrl = await storageService.uploadImage(motionData.videoFile, `videos/${Date.now()}_${motionData.videoFile.name}`);
        } catch (uploadError) {
          console.error('Video upload error:', uploadError);
          setError('Failed to upload video. Please try again.');
          setLoading(false);
          return;
        }
      }

      const articleData = {
        title: motionData.title,
        excerpt: motionData.excerpt,
        content: videoUrl,
        category: 'motion',
        featuredImage: imageUrl,
        tags: motionData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email,
        status,
        views: 0,
        isMotion: true
      };

      await articleService.createArticle(articleData);

      if (status === 'pending') {
        success('Video submitted for review!');
      } else {
        success('Video saved as draft!');
      }
      navigate('/profile');
    } catch (err) {
      console.error('Error creating video:', err);
      showError(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async () => {
    const hasContent = motionData.title || motionData.excerpt;
    if (hasContent) {
      const confirmed = await showConfirmation({
        title: 'Discard Changes?',
        message: 'Are you sure? All unsaved changes will be lost.',
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
        type: 'warning'
      });
      if (confirmed) navigate('/profile');
    } else {
      navigate('/profile');
    }
  };

  // === For Word & Lens: show the block-based editor ===
  if (category === 'word' || category === 'lens') {
    return (
      <div className="create-story-container create-story-editor-mode">
        {/* Category switcher at top */}
        <div className="editor-category-bar">
          <div className="category-selector compact">
            <button
              className={`category-tab ${category === 'word' ? 'active' : ''}`}
              onClick={() => setCategory('word')}
            >
              Indic Word
            </button>
            <button
              className={`category-tab ${category === 'lens' ? 'active' : ''}`}
              onClick={() => setCategory('lens')}
            >
              Indic Lens
            </button>
            <button
              className={`category-tab ${category === 'motion' ? 'active' : ''}`}
              onClick={() => setCategory('motion')}
            >
              Indic Motion
            </button>
          </div>
        </div>
        <StoryEditor
          onSave={handleEditorPublish}
          onSaveDraft={handleEditorDraft}
          initialData={null}
          category={category}
        />
      </div>
    );
  }

  // === For Motion: show direct upload form ===
  return (
    <div className="create-story-container">
      <div className="editor-category-bar">
        <div className="category-selector compact">
          <button
            className={`category-tab ${category === 'word' ? 'active' : ''}`}
            onClick={() => setCategory('word')}
          >
            Indic Word
          </button>
          <button
            className={`category-tab ${category === 'lens' ? 'active' : ''}`}
            onClick={() => setCategory('lens')}
          >
            Indic Lens
          </button>
          <button
            className={`category-tab ${category === 'motion' ? 'active' : ''}`}
            onClick={() => setCategory('motion')}
          >
            Indic Motion
          </button>
        </div>
      </div>

      <div className="create-story-header">
        <h1>Upload Video</h1>
        <p className="create-story-subtitle">Share a documentary, film, or video essay</p>
      </div>

      <form className="create-story-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={motionData.title}
            onChange={handleMotionInputChange}
            placeholder="Enter a title for your video"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Description *</label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={motionData.excerpt}
            onChange={handleMotionInputChange}
            placeholder="Brief description of your video (max 200 characters)"
            maxLength={200}
            rows={3}
            required
          />
          <small className="char-count">{motionData.excerpt.length}/200</small>
        </div>

        <div className="form-group">
          <label htmlFor="videoFile">Video File *</label>
          <input
            type="file"
            id="videoFile"
            accept="video/*"
            onChange={handleVideoChange}
            className="file-input"
          />
          {motionData.videoFile && (
            <div className="file-selected">
              Selected: {motionData.videoFile.name} ({(motionData.videoFile.size / (1024 * 1024)).toFixed(1)} MB)
            </div>
          )}
          <small className="form-hint">Max 100MB. Supported: MP4, MOV, AVI, WebM</small>
        </div>

        <div className="form-group">
          <label htmlFor="featuredImage">Thumbnail Image</label>
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
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (Optional)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={motionData.tags}
            onChange={handleMotionInputChange}
            placeholder="e.g., documentary, short film, india"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

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
            onClick={() => handleMotionSubmit('draft')}
            className="draft-btn"
            disabled={loading || !motionData.title || !motionData.excerpt}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={() => handleMotionSubmit('pending')}
            className="submit-btn"
            disabled={loading || !motionData.title || !motionData.excerpt || !motionData.videoFile}
          >
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStory;

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService, storageService } from '../firebase/services';
import { useNotification } from '../components/common/NotificationSystem';
import TiptapEditor from '../components/TiptapEditor';
import './CreateStory.css';

const CreateStory = () => {
  const { currentUser, userData } = useAuth();
  const { success, error: showError, showConfirmation } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Map URL ?category param to editor tab: word/lens → desk, motion → motion
  const urlCategory = searchParams.get('category') || 'word';
  const [editorTab, setEditorTab] = useState(urlCategory === 'motion' ? 'motion' : 'desk');

  // Motion-specific state
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

  // === Desk editor save handler (Word & Lens) ===
  const handleEditorSave = async (storyData) => {
    if (!currentUser) {
      showError('You must be logged in to create a story');
      navigate('/auth');
      return;
    }

    const status = storyData.status || 'pending';

    try {
      // Upload thumbnail if provided
      let featuredImageUrl = storyData.coverImage || '';
      if (storyData.thumbnailFile) {
        try {
          featuredImageUrl = await storageService.uploadImage(
            storyData.thumbnailFile,
            `articles/${Date.now()}_${storyData.thumbnailFile.name}`
          );
        } catch (uploadErr) {
          console.error('Thumbnail upload error:', uploadErr);
        }
      }

      const articleData = {
        title: storyData.title || 'Untitled Story',
        excerpt: storyData.subtitle || '',
        content: storyData.content || '',
        category: storyData.category || 'word',
        featuredImage: featuredImageUrl,
        tags: storyData.tags || [],
        authorId: currentUser.uid,
        authorName: storyData.authorName || userData?.displayName || currentUser.email,
        status,
        views: 0,
        isVisualStory: true
      };

      if (storyData.contentJSON) {
        articleData.contentJSON = JSON.stringify(storyData.contentJSON);
      }

      await articleService.createArticle(articleData);

      if (status === 'pending') {
        success('Your story has been submitted for review. You\'ll be notified once it\'s published.');
      } else {
        success('Draft saved. You can continue editing anytime from your dashboard.');
      }
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      console.error('Error creating story:', err);
      showError(`Failed to save story: ${err.message || 'Unknown error'}`);
    }
  };

  // === Motion form handlers ===
  const handleMotionInputChange = (e) => {
    const { name, value } = e.target;
    setMotionData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('Image size must be less than 5MB'); return; }
      if (!file.type.startsWith('image/')) { setError('File must be an image'); return; }
      setFeaturedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { setError('Video must be less than 100MB'); return; }
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
        tags: motionData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        authorId: currentUser.uid,
        authorName: userData?.displayName || currentUser.email,
        status,
        views: 0,
        isMotion: true
      };
      await articleService.createArticle(articleData);
      success(status === 'pending' ? 'Video submitted for review!' : 'Video saved as draft!');
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

  // === Desk tab: TiptapEditor for Word & Lens ===
  if (editorTab === 'desk') {
    return (
      <div className="create-story-container create-story-editor-mode">
        <div className="editor-category-bar">
          <div className="category-selector compact">
            <button className="category-tab active">Desk</button>
            <button className="category-tab" onClick={() => setEditorTab('motion')}>Motion</button>
          </div>
        </div>
        <TiptapEditor
          onSave={handleEditorSave}
          onSaveDraft={handleEditorSave}
          category={urlCategory === 'lens' ? 'lens' : 'word'}
          authorName={userData?.displayName || currentUser?.email || ''}
        />
      </div>
    );
  }

  // === Motion tab: Upload form ===
  return (
    <div className="create-story-container">
      <div className="editor-category-bar">
        <div className="category-selector compact">
          <button className="category-tab" onClick={() => setEditorTab('desk')}>Desk</button>
          <button className="category-tab active">Motion</button>
        </div>
      </div>

      <div className="create-story-header">
        <h1>Upload Video</h1>
        <p className="create-story-subtitle">Share a documentary, film, or video essay</p>
      </div>

      <form className="create-story-form">
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input type="text" id="title" name="title" value={motionData.title} onChange={handleMotionInputChange} placeholder="Enter a title for your video" required />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Description *</label>
          <textarea id="excerpt" name="excerpt" value={motionData.excerpt} onChange={handleMotionInputChange} placeholder="Brief description of your video (max 200 characters)" maxLength={200} rows={3} required />
          <small className="char-count">{motionData.excerpt.length}/200</small>
        </div>

        <div className="form-group">
          <label htmlFor="videoFile">Video File *</label>
          <input type="file" id="videoFile" accept="video/*" onChange={handleVideoChange} className="file-input" />
          {motionData.videoFile && (
            <div className="file-selected">
              Selected: {motionData.videoFile.name} ({(motionData.videoFile.size / (1024 * 1024)).toFixed(1)} MB)
            </div>
          )}
          <small className="form-hint">Max 100MB. Supported: MP4, MOV, AVI, WebM</small>
        </div>

        <div className="form-group">
          <label htmlFor="featuredImage">Thumbnail Image</label>
          <input type="file" id="featuredImage" accept="image/*" onChange={handleImageChange} className="file-input" />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button type="button" onClick={() => { setFeaturedImage(null); setImagePreview(null); }} className="remove-image-btn">Remove</button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (Optional)</label>
          <input type="text" id="tags" name="tags" value={motionData.tags} onChange={handleMotionInputChange} placeholder="e.g., documentary, short film, india" />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button type="button" onClick={handleDiscard} className="discard-btn" disabled={loading}>Discard</button>
          <button type="button" onClick={() => handleMotionSubmit('draft')} className="draft-btn" disabled={loading || !motionData.title || !motionData.excerpt}>
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="button" onClick={() => handleMotionSubmit('pending')} className="submit-btn" disabled={loading || !motionData.title || !motionData.excerpt || !motionData.videoFile}>
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateStory;

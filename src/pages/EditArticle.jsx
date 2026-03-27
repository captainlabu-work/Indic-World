import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService, storageService } from '../firebase/services';
import { useNotification } from '../components/common/NotificationSystem';
import TiptapEditor from '../components/TiptapEditor';
import './CreateStory.css';

const EditArticle = () => {
  const { currentUser, userData } = useAuth();
  const { success, error: showError, showConfirmation } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Motion edit state
  const [motionData, setMotionData] = useState({ title: '', excerpt: '', tags: '' });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const articleData = await articleService.getArticle(id);
        if (!articleData) {
          setError('Article not found');
          return;
        }
        if (articleData.authorId !== currentUser.uid) {
          setError('You do not have permission to edit this article');
          return;
        }
        setArticle(articleData);
        // Pre-fill motion form if motion article
        if (articleData.isMotion || articleData.category === 'motion') {
          setMotionData({
            title: articleData.title || '',
            excerpt: articleData.excerpt || '',
            tags: articleData.tags?.join(', ') || ''
          });
          setImagePreview(articleData.featuredImage || null);
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id, currentUser.uid]);

  // === Desk editor save handler (Word & Lens) ===
  const handleEditorSave = async (storyData) => {
    try {
      // Upload new thumbnail if provided
      let featuredImageUrl = article.featuredImage || '';
      if (storyData.thumbnailFile) {
        featuredImageUrl = await storageService.uploadImage(
          storyData.thumbnailFile,
          `articles/${Date.now()}_${storyData.thumbnailFile.name}`
        );
      }

      const updateData = {
        title: storyData.title || 'Untitled Story',
        excerpt: storyData.subtitle || '',
        content: storyData.content || '',
        category: storyData.category || article.category || 'word',
        featuredImage: featuredImageUrl,
        thumbnailCaption: storyData.thumbnailCaption || '',
        sourceText: storyData.sourceText || '',
        tags: storyData.tags || article.tags || [],
        status: storyData.status,
        isVisualStory: true,
      };
      if (storyData.contentJSON) {
        updateData.contentJSON = JSON.stringify(storyData.contentJSON);
      }
      if (article.status === 'needs-revision' && storyData.status === 'pending') {
        updateData.isRevised = true;
        updateData.revisionNote = '';
      }
      await articleService.updateArticle(id, updateData);
      if (storyData.status === 'pending') {
        success('Story submitted for review!');
      } else {
        success('Draft saved successfully!');
      }
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      console.error('Error updating story:', err);
      showError(`Failed to save: ${err.message || 'Unknown error'}`);
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
      if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB'); return; }
      if (!file.type.startsWith('image/')) { setError('File must be an image'); return; }
      setFeaturedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleMotionSubmit = async (status = 'draft') => {
    setSaving(true);
    try {
      let imageUrl = article.featuredImage || '';
      if (featuredImage) {
        imageUrl = await storageService.uploadImage(featuredImage, `articles/${Date.now()}_${featuredImage.name}`);
      }
      const updateData = {
        title: motionData.title,
        excerpt: motionData.excerpt,
        featuredImage: imageUrl,
        tags: motionData.tags.split(',').map(t => t.trim()).filter(Boolean),
        category: 'motion',
        status,
      };
      if (article.status === 'needs-revision' && status === 'pending') {
        updateData.isRevised = true;
        updateData.revisionNote = '';
      }
      await articleService.updateArticle(id, updateData);
      success(status === 'pending' ? 'Video submitted for review!' : 'Draft saved!');
      navigate('/profile');
    } catch (err) {
      console.error('Error updating video:', err);
      showError(`Failed to save: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    const confirmed = await showConfirmation({
      title: 'Discard Changes?',
      message: 'Are you sure? All unsaved changes will be lost.',
      confirmText: 'Discard',
      cancelText: 'Keep Editing',
      type: 'warning'
    });
    if (confirmed) navigate('/profile');
  };

  if (loading) {
    return <div className="create-story-container"><div className="loading-state">Loading article...</div></div>;
  }
  if (error && !article) {
    return <div className="create-story-container"><div className="error-message">{error}</div></div>;
  }

  const isMotion = article.isMotion || article.category === 'motion';

  // === Motion edit form ===
  if (isMotion) {
    return (
      <div className="create-story-container">
        <div className="create-story-header">
          <h1>Edit Video</h1>
          <p className="create-story-subtitle">Update your video submission</p>
          {article.status === 'needs-revision' && article.revisionNote && (
            <div className="revision-note">
              <strong>Admin Feedback:</strong> {article.revisionNote}
            </div>
          )}
        </div>
        <form className="create-story-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input type="text" id="title" name="title" value={motionData.title} onChange={handleMotionInputChange} placeholder="Video title" required />
          </div>
          <div className="form-group">
            <label htmlFor="excerpt">Description *</label>
            <textarea id="excerpt" name="excerpt" value={motionData.excerpt} onChange={handleMotionInputChange} placeholder="Brief description" maxLength={200} rows={3} required />
            <small className="char-count">{motionData.excerpt.length}/200</small>
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
            <input type="text" id="tags" name="tags" value={motionData.tags} onChange={handleMotionInputChange} placeholder="e.g., documentary, short film" />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button type="button" onClick={handleDiscard} className="discard-btn" disabled={saving}>Discard</button>
            <button type="button" onClick={() => handleMotionSubmit('draft')} className="draft-btn" disabled={saving || !motionData.title || !motionData.excerpt}>
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button type="button" onClick={() => handleMotionSubmit('pending')} className="submit-btn" disabled={saving || !motionData.title || !motionData.excerpt}>
              {saving ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // === Desk editor (Word & Lens) ===
  // Parse contentJSON if it's stored as string
  let contentJSON = article.contentJSON;
  if (typeof contentJSON === 'string') {
    try { contentJSON = JSON.parse(contentJSON); } catch { contentJSON = null; }
  }

  const initialData = {
    title: article.title || '',
    subtitle: article.excerpt || '',
    authorName: article.authorName || '',
    contentJSON,
    content: article.content || '',
    category: article.category || 'word',
    tags: article.tags || [],
    featuredImage: article.featuredImage || null,
  };

  return (
    <div className="create-story-container create-story-editor-mode">
      {article.status === 'needs-revision' && article.revisionNote && (
        <div className="revision-banner">
          <strong>Admin Feedback:</strong> {article.revisionNote}
        </div>
      )}
      <TiptapEditor
        onSave={handleEditorSave}
        onSaveDraft={handleEditorSave}
        initialData={initialData}
        authorName={article.authorName || userData?.displayName || currentUser?.email || ''}
      />
    </div>
  );
};

export default EditArticle;

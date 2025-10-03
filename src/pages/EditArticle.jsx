import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService, storageService } from '../firebase/services';
import { useNotification } from '../components/common/NotificationSystem';
import RichTextEditor from '../components/RichTextEditor';
import './CreateStory.css';

const EditArticle = () => {
  const { currentUser, userData } = useAuth();
  const { success, error: showError, info, showConfirmation } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    tags: ''
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [article, setArticle] = useState(null);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const articleData = await articleService.getArticle(id);

      if (!articleData) {
        setError('Article not found');
        return;
      }

      // Check if user owns this article
      if (articleData.authorId !== currentUser.uid) {
        setError('You do not have permission to edit this article');
        return;
      }

      setArticle(articleData);
      setFormData({
        title: articleData.title,
        excerpt: articleData.excerpt,
        content: articleData.content,
        tags: articleData.tags?.join(', ') || ''
      });
      setExistingImageUrl(articleData.featuredImage || '');
      setImagePreview(articleData.featuredImage || null);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

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
    const confirmed = await showConfirmation({
      title: 'Discard Changes?',
      message: 'Are you sure you want to discard all unsaved changes?',
      confirmText: 'Discard',
      cancelText: 'Keep Editing',
      type: 'warning'
    });

    if (confirmed) {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e, status = 'draft') => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      let imageUrl = existingImageUrl;

      // Upload new image if changed
      if (featuredImage) {
        imageUrl = await storageService.uploadImage(featuredImage, `articles/${Date.now()}_${featuredImage.name}`);
      }

      // Prepare article data
      const articleData = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        featuredImage: imageUrl,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        status: status
      };

      // If this was previously needs-revision and now being resubmitted, mark as revised
      if (article?.status === 'needs-revision' && status === 'pending') {
        articleData.isRevised = true;
        articleData.revisionNote = ''; // Clear the revision note
      }

      // Update article
      await articleService.updateArticle(id, articleData);

      // Show success message
      if (status === 'pending') {
        if (article?.status === 'needs-revision') {
          success('Revised article submitted for review!');
          info('Article sent back for revision with your feedback');
        } else {
          success('Article updated and submitted for review!');
        }
      } else {
        success('Article updated successfully!');
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Error updating article:', err);
      setError('Failed to update article. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="create-story-container">
        <div className="loading-state">Loading article...</div>
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="create-story-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="create-story-container">
      <div className="create-story-header">
        <h1>Edit Your Story</h1>
        <p className="create-story-subtitle">Make changes to your story</p>
        {article?.status === 'needs-revision' && article?.revisionNote && (
          <div className="revision-note">
            <strong>Admin Feedback:</strong> {article.revisionNote}
          </div>
        )}
      </div>

      <form className="create-story-form">
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
                  setExistingImageUrl('');
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
            disabled={saving}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            className="draft-btn"
            disabled={saving || !formData.title || !formData.excerpt || !formData.content}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'pending')}
            className="submit-btn"
            disabled={saving || !formData.title || !formData.excerpt || !formData.content}
          >
            {saving ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditArticle;

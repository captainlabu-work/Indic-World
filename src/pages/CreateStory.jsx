import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService, storageService, validateFirestorePayload, sanitizePayload } from '../firebase/services';
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
    videoFile: null,
    type: '',
    theme: ''
  });
  const [featuredImage, setFeaturedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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
        featuredImageUrl = await storageService.uploadImage(
          storyData.thumbnailFile,
          `articles/${Date.now()}_${storyData.thumbnailFile.name}`
        );
      }

      // Upload inline base64 images to Storage before Firestore write
      const { html: cleanContent, json: cleanJSON } = await storageService.uploadContentImages(
        storyData.content || '',
        storyData.contentJSON || null
      );

      const articleData = {
        title: storyData.title || 'Untitled Story',
        excerpt: storyData.subtitle || '',
        content: cleanContent,
        category: storyData.category || 'word',
        featuredImage: featuredImageUrl,
        thumbnailCaption: storyData.thumbnailCaption || '',
        sourceText: storyData.sourceText || '',
        tags: storyData.tags || [],
        authorId: currentUser.uid,
        authorName: storyData.authorName || userData?.displayName || currentUser.email,
        status,
        views: 0,
        isVisualStory: true
      };

      if (cleanJSON) {
        articleData.contentJSON = typeof cleanJSON === 'string' ? cleanJSON : JSON.stringify(cleanJSON);
      }

      // Sanitize: remove File/Blob/undefined before Firestore write
      const sanitized = sanitizePayload(articleData);

      // Validate: check for remaining invalid values
      const issues = validateFirestorePayload(sanitized);
      if (issues.length > 0) {
        console.error('[CreateStory] Payload validation issues:', issues);
        // Also validate the contentJSON string by parsing it
        if (sanitized.contentJSON) {
          try {
            const parsed = JSON.parse(sanitized.contentJSON);
            const jsonIssues = validateFirestorePayload(parsed, 'contentJSON(parsed)');
            if (jsonIssues.length > 0) {
              console.error('[CreateStory] contentJSON internal issues:', jsonIssues);
            }
          } catch (e) {
            console.error('[CreateStory] contentJSON is not valid JSON:', e.message);
          }
        }
        // Log base64/blob counts
        const jsonStr = sanitized.contentJSON || '';
        const base64Count = (jsonStr.match(/data:image\//g) || []).length;
        const blobCount = (jsonStr.match(/blob:/g) || []).length;
        console.error(`[CreateStory] contentJSON still has ${base64Count} base64, ${blobCount} blob URLs`);

        // Block save if base64 still present (would exceed Firestore limit)
        if (base64Count > 0) {
          showError(`Save blocked: ${base64Count} image(s) failed to upload. Please try again.`);
          return;
        }
      }

      console.log('[CreateStory] Final payload size:', JSON.stringify(sanitized).length, 'bytes');

      // If auto-draft exists, update it instead of creating duplicate
      if (storyData.existingDraftId) {
        sanitized.isAutoDraft = false; // promote from auto-draft to real save
        await articleService.updateArticle(storyData.existingDraftId, sanitized);
      } else {
        await articleService.createArticle(sanitized);
      }

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
        isMotion: true,
        motionType: motionData.type || '',
        motionTheme: motionData.theme || ''
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
          currentUser={currentUser}
        />
      </div>
    );
  }

  // === Drag-and-drop handlers for upload zone ===
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      if (file.size > 100 * 1024 * 1024) { setError('Video must be less than 100MB'); return; }
      setMotionData(prev => ({ ...prev, videoFile: file }));
      setError('');
    } else if (file) {
      setError('Please drop a video file (MP4, MOV, AVI, WebM)');
    }
  };

  const motionTypes = ['Documentary', 'Short Film', 'Video Essay', 'Interview', 'Experimental', 'Fiction'];
  const motionThemes = ['Culture & Heritage', 'Identity & Diaspora', 'Nature & Environment', 'History & Memory', 'Spirituality & Philosophy', 'Art & Craft', 'Urban Life', 'Rural India', 'Social Justice', 'Language & Literature'];

  // === Motion tab: Upload form ===
  return (
    <div className="create-story-container motion-container">
      <div className="editor-category-bar">
        <div className="category-selector compact">
          <button className="category-tab" onClick={() => setEditorTab('desk')}>Desk</button>
          <button className="category-tab active">Motion</button>
        </div>
      </div>

      {/* Header row with title and submit button */}
      <div className="motion-header-row">
        <div className="motion-header-text">
          <h1>New Motion Submission</h1>
          <p className="create-story-subtitle">Share a documentary, film, or video essay.</p>
        </div>
        <button
          type="button"
          onClick={() => handleMotionSubmit('pending')}
          className="motion-submit-top"
          disabled={loading || !motionData.title || !motionData.excerpt || !motionData.videoFile || !motionData.type}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>

      {/* Two-column: Upload zone + Specifications */}
      <div className="motion-upload-row">
        <div
          className={`motion-upload-zone${isDragging ? ' dragging' : ''}${motionData.videoFile ? ' has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('videoFile').click()}
        >
          <input
            type="file"
            id="videoFile"
            accept="video/*"
            onChange={handleVideoChange}
            style={{ display: 'none' }}
          />
          {motionData.videoFile ? (
            <div className="upload-zone-selected">
              <div className="upload-zone-icon">&#9654;</div>
              <p className="upload-zone-filename">{motionData.videoFile.name}</p>
              <p className="upload-zone-filesize">{(motionData.videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
              <button
                type="button"
                className="upload-zone-remove"
                onClick={(e) => { e.stopPropagation(); setMotionData(prev => ({ ...prev, videoFile: null })); }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="upload-zone-empty">
              <div className="upload-zone-icon-large">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="#e8f5f1" stroke="#7ecab5" strokeWidth="2"/>
                  <path d="M24 14v16M16 22l8-8 8 8" stroke="#4db897" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="upload-zone-text">Drag and drop your video here, or click to browse</p>
              <p className="upload-zone-hint">MP4, MOV, AVI, WebM &middot; Max 100MB</p>
            </div>
          )}
        </div>

        <div className="motion-specs-panel">
          <h3>Specifications</h3>
          <div className="specs-list">
            <div className="spec-item">
              <span className="spec-icon">&#9654;</span>
              <span className="spec-label">File Type</span>
              <span className="spec-value">.mp4, .mov, .avi, .webm</span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">&#128190;</span>
              <span className="spec-label">Max Size</span>
              <span className="spec-value">100 MB</span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">&#9634;</span>
              <span className="spec-label">Aspect Ratio</span>
              <span className="spec-value">16:9 recommended</span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">&#9201;</span>
              <span className="spec-label">Duration</span>
              <span className="spec-value">No limit</span>
            </div>
            <div className="specs-divider"></div>
            <div className="spec-item">
              <span className="spec-icon">&#9654;</span>
              <span className="spec-label">Type</span>
              <span className={`spec-value${!motionData.type ? ' spec-placeholder' : ''}`}>
                {motionData.type || 'Not selected'}
              </span>
            </div>
            <div className="spec-item">
              <span className="spec-icon">&#9670;</span>
              <span className="spec-label">Theme</span>
              <span className={`spec-value${!motionData.theme ? ' spec-placeholder' : ''}`}>
                {motionData.theme || 'Not selected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Story Details section */}
      <div className="motion-details-section">
        <h2>Story Details</h2>
        <p className="motion-details-subtitle">Details about the video you are submitting.</p>

        <div className="motion-fields-row">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input type="text" id="title" name="title" value={motionData.title} onChange={handleMotionInputChange} placeholder="Enter a title for your video" required />
          </div>
          <div className="form-group">
            <label htmlFor="type">Type *</label>
            <select id="type" name="type" value={motionData.type} onChange={handleMotionInputChange} required className="motion-select">
              <option value="">Select type</option>
              {motionTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="theme">Theme</label>
            <select id="theme" name="theme" value={motionData.theme} onChange={handleMotionInputChange} className="motion-select">
              <option value="">Select theme (optional)</option>
              {motionThemes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Description *</label>
          <textarea id="excerpt" name="excerpt" value={motionData.excerpt} onChange={handleMotionInputChange} placeholder="Brief description of your video (max 200 characters)" maxLength={200} rows={3} required />
          <small className="char-count">{motionData.excerpt.length}/200</small>
        </div>

        <div className="motion-fields-row two-col">
          <div className="form-group">
            <label htmlFor="featuredImage">Thumbnail Image</label>
            <div className="motion-file-input-wrapper">
              <input type="file" id="featuredImage" accept="image/*" onChange={handleImageChange} className="file-input" />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" onClick={() => { setFeaturedImage(null); setImagePreview(null); }} className="remove-image-btn">Remove</button>
                </div>
              )}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="tags">Tags (Optional)</label>
            <input type="text" id="tags" name="tags" value={motionData.tags} onChange={handleMotionInputChange} placeholder="e.g., documentary, short film, india" />
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions motion-actions">
        <button type="button" onClick={handleDiscard} className="discard-btn" disabled={loading}>Discard</button>
        <button type="button" onClick={() => handleMotionSubmit('draft')} className="draft-btn" disabled={loading || !motionData.title || !motionData.excerpt}>
          {loading ? 'Saving...' : 'Save as Draft'}
        </button>
        <button type="button" onClick={() => handleMotionSubmit('pending')} className="submit-btn" disabled={loading || !motionData.title || !motionData.excerpt || !motionData.videoFile || !motionData.type}>
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
};

export default CreateStory;

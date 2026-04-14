import { useState, useEffect } from 'react';
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

  // Edit mode: ?edit=<articleId> pre-fills the Motion form for updating
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);
  const [editArticle, setEditArticle] = useState(null);
  const [editLoading, setEditLoading] = useState(Boolean(editId));
  const [existingVideoUrl, setExistingVideoUrl] = useState(null);

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
  const [uploadProgress, setUploadProgress] = useState(null); // null = not uploading, 0-100 = progress
  const [uploadComplete, setUploadComplete] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);

  // Fetch existing article data for edit mode
  useEffect(() => {
    if (!editId) return;
    const fetchEditData = async () => {
      try {
        const data = await articleService.getArticle(editId);
        if (!data) { setError('Article not found'); setEditLoading(false); return; }
        if (data.authorId !== currentUser?.uid) { setError('You do not have permission to edit this'); setEditLoading(false); return; }
        setEditArticle(data);
        setMotionData({
          title: data.title || '',
          excerpt: data.excerpt || '',
          tags: data.tags?.join(', ') || '',
          videoFile: null,
          type: data.motionType || '',
          theme: data.motionTheme || ''
        });
        if (data.featuredImage) setImagePreview(data.featuredImage);
        if (data.content) setExistingVideoUrl(data.content);
      } catch (err) {
        console.error('Error fetching article for edit:', err);
        setError('Failed to load article');
      } finally {
        setEditLoading(false);
      }
    };
    fetchEditData();
  }, [editId, currentUser?.uid]);

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

  const extractVideoDuration = (file) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  };

  const formatDuration = (seconds) => {
    if (!seconds || !isFinite(seconds)) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 750 * 1024 * 1024) { setError('File exceeds 750MB limit. Please compress your video.'); return; }
      setMotionData(prev => ({ ...prev, videoFile: file }));
      setError('');
      setUploadComplete(false);
      setUploadProgress(null);
      setVideoDuration(null);
      extractVideoDuration(file);
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
      // Upload thumbnail if new one provided, else keep existing
      let imageUrl = isEditMode ? (editArticle?.featuredImage || '') : '';
      if (featuredImage) {
        try {
          imageUrl = await storageService.uploadImage(featuredImage, `articles/${Date.now()}_${featuredImage.name}`);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }

      // Upload video if new one provided, else keep existing
      let videoUrl = existingVideoUrl || '';
      if (motionData.videoFile) {
        try {
          setUploadProgress(0);
          setUploadComplete(false);
          videoUrl = await storageService.uploadWithProgress(
            motionData.videoFile,
            `videos/${Date.now()}_${motionData.videoFile.name}`,
            (progress) => setUploadProgress(progress)
          );
          setUploadProgress(100);
          setUploadComplete(true);
        } catch (uploadError) {
          console.error('Video upload error:', uploadError);
          setError('Upload failed. Please try again or compress your video.');
          setUploadProgress(null);
          setLoading(false);
          return;
        }
      }

      if (isEditMode) {
        // Update existing article
        const updateData = {
          title: motionData.title,
          excerpt: motionData.excerpt,
          content: videoUrl,
          featuredImage: imageUrl,
          tags: motionData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
          category: 'motion',
          motionType: motionData.type || '',
          motionTheme: motionData.theme || '',
          status,
        };
        if (editArticle?.status === 'needs-revision' && status === 'pending') {
          updateData.isRevised = true;
          updateData.revisionNote = '';
        }
        await articleService.updateArticle(editId, updateData);
        success(status === 'pending' ? 'Video submitted for review!' : 'Draft saved!');
      } else {
        // Create new article
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
      }
      navigate('/profile');
    } catch (err) {
      console.error('Error saving video:', err);
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

  // Loading state for edit mode
  if (editLoading) {
    return <div className="create-story-container"><div className="loading-state">Loading video data...</div></div>;
  }

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
      if (file.size > 750 * 1024 * 1024) { setError('File exceeds 750MB limit. Please compress your video.'); return; }
      setMotionData(prev => ({ ...prev, videoFile: file }));
      setError('');
      setUploadComplete(false);
      setUploadProgress(null);
      setVideoDuration(null);
      extractVideoDuration(file);
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
          <h1>{isEditMode ? 'Edit Motion' : 'New Motion Submission'}</h1>
          <p className="motion-header-sub">{isEditMode ? 'Update your video submission.' : 'Share a documentary, film, or video essay.'}</p>
          {isEditMode && editArticle?.status === 'needs-revision' && editArticle?.revisionNote && (
            <div className="revision-note" style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: '#ede9fe', borderRadius: '4px', fontSize: '0.9rem', color: '#5b21b6' }}>
              <strong>Admin Feedback:</strong> {editArticle.revisionNote}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleMotionSubmit('pending')}
          className="motion-submit-top"
          disabled={loading || !motionData.title || !motionData.excerpt || (!motionData.videoFile && !existingVideoUrl) || !motionData.type || (uploadProgress !== null && !uploadComplete)}
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>

      {/* Two-column: Upload LEFT + Specifications RIGHT */}
      <div className="motion-upload-row">
        <div
          className={`motion-upload-zone${isDragging ? ' dragging' : ''}${motionData.videoFile ? ' has-file' : ''}${error ? ' has-error' : ''}${uploadProgress !== null && uploadProgress < 100 ? ' uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => { if (uploadProgress === null || uploadComplete) document.getElementById('videoFile').click(); }}
        >
          <input
            type="file"
            id="videoFile"
            accept="video/*"
            onChange={handleVideoChange}
            style={{ display: 'none' }}
          />
          {error && <p className="upload-zone-error">{error}</p>}
          {uploadProgress !== null && !uploadComplete && (
            <div className="upload-progress-overlay">
              <div className="upload-progress-ring">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#e8e8e6" strokeWidth="4"/>
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#4db897" strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - uploadProgress / 100)}`}
                    style={{ transition: 'stroke-dashoffset 0.3s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                  />
                </svg>
                <span className="upload-progress-percent">{uploadProgress}%</span>
              </div>
              <p className="upload-progress-text">Uploading...</p>
            </div>
          )}
          {uploadComplete && motionData.videoFile && (
            <div className="upload-zone-selected">
              <div className="upload-complete-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="#f0faf6" stroke="#4db897" strokeWidth="1.5"/>
                  <path d="M15 24l6 6 12-12" stroke="#4db897" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="upload-complete-text">Upload complete</p>
              <p className="upload-zone-filename">{motionData.videoFile.name}</p>
              <p className="upload-zone-filesize">
                {(motionData.videoFile.size / (1024 * 1024)).toFixed(1)} MB
                {videoDuration && <span> &middot; {formatDuration(videoDuration)}</span>}
              </p>
            </div>
          )}
          {motionData.videoFile && uploadProgress === null && !uploadComplete ? (
            <div className="upload-zone-selected">
              <div className="upload-selected-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="2" y="2" width="44" height="44" rx="10" fill="#f0faf6" stroke="#4db897" strokeWidth="1.5"/>
                  <polygon points="19,14 19,34 35,24" fill="#4db897"/>
                </svg>
              </div>
              <p className="upload-zone-filename">{motionData.videoFile.name}</p>
              <p className="upload-zone-filesize">
                {(motionData.videoFile.size / (1024 * 1024)).toFixed(1)} MB
                {videoDuration && <span> &middot; {formatDuration(videoDuration)}</span>}
              </p>
              <div className="upload-zone-actions">
                <button
                  type="button"
                  className="upload-action-btn replace"
                  onClick={(e) => { e.stopPropagation(); document.getElementById('videoFile').click(); }}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="upload-action-btn remove"
                  onClick={(e) => { e.stopPropagation(); setMotionData(prev => ({ ...prev, videoFile: null })); setVideoDuration(null); setUploadProgress(null); setUploadComplete(false); }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : !motionData.videoFile && existingVideoUrl && uploadProgress === null && (
            <div className="upload-zone-selected">
              <div className="upload-complete-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="22" fill="#f0faf6" stroke="#4db897" strokeWidth="1.5"/>
                  <path d="M15 24l6 6 12-12" stroke="#4db897" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="upload-complete-text">Video uploaded</p>
              <p className="upload-zone-hint" style={{ marginTop: '0.5rem' }}>Click to replace with a new video</p>
            </div>
          )}
          {!motionData.videoFile && !existingVideoUrl && uploadProgress === null && (
            <div className="upload-zone-empty">
              <div className="upload-zone-icon-large">
                <svg width="58" height="58" viewBox="0 0 58 58" fill="none">
                  <circle cx="29" cy="29" r="27.5" fill="none" stroke="rgba(77,184,151,0.28)" strokeWidth="1.5"/>
                  <path d="M29 18v20M21 28l8-8 8 8" stroke="#4db897" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="upload-zone-title">Upload your film</p>
              <p className="upload-zone-text">Drag and drop or click to browse</p>
              <p className="upload-zone-hint">MP4, MOV, AVI, WebM &middot; Max 750MB &middot; Duration: --</p>
              <p className="upload-zone-tip">Large files may fail to upload. Compress your video before submitting.</p>
            </div>
          )}
        </div>

        {/* Specifications panel on the right */}
        <div className="motion-specs-panel">
          <h3>Specifications</h3>
          <div className="specs-list">
            <div className="spec-item">
              <span className="spec-label">File Type</span>
              <span className="spec-value">.mp4, .mov, .avi, .webm</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Max Size</span>
              <span className="spec-value">750 MB</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Aspect Ratio</span>
              <span className="spec-value">16:9 recommended</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Duration</span>
              <span className="spec-value">No limit</span>
            </div>
          </div>
          <div className="specs-divider"></div>
          <h3>Your Selection</h3>
          <div className="specs-list">
            <div className="spec-item">
              <span className="spec-label">Type</span>
              {motionData.type ? (
                <span className="spec-pill">{motionData.type}</span>
              ) : (
                <span className="spec-value spec-placeholder">Not selected</span>
              )}
            </div>
            <div className="spec-item">
              <span className="spec-label">Theme</span>
              {motionData.theme ? (
                <span className="spec-pill">{motionData.theme}</span>
              ) : (
                <span className="spec-value spec-placeholder">Not selected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Story Details section below */}
      <div className="motion-details-section">
        <h2>Story Details</h2>
        <p className="motion-details-subtitle">Tell us about your film.</p>

        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input type="text" id="title" name="title" value={motionData.title} onChange={handleMotionInputChange} placeholder="What is your film called?" required />
        </div>

        <div className="motion-fields-row two-col">
          <div className="form-group">
            <label htmlFor="type">Type</label>
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
          <label htmlFor="excerpt">Description</label>
          <textarea id="excerpt" name="excerpt" value={motionData.excerpt} onChange={handleMotionInputChange} placeholder="A brief synopsis of your film" maxLength={2400} rows={5} required />
          <small className="char-count">{motionData.excerpt.trim().split(/\s+/).filter(Boolean).length}/400 words</small>
        </div>

        <div className="form-group">
          <label htmlFor="featuredImage">Thumbnail Image</label>
          <p className="motion-field-hint">A cover image for your film. JPG or PNG, max 5MB.</p>
          <div className="motion-thumbnail-wrapper">
            {imagePreview ? (
              <div className="motion-thumbnail-preview">
                <img src={imagePreview} alt="Thumbnail preview" />
                <div className="motion-thumbnail-actions">
                  <button type="button" onClick={() => { document.getElementById('featuredImage').click(); }} className="upload-action-btn replace">Replace</button>
                  <button type="button" onClick={() => { setFeaturedImage(null); setImagePreview(null); }} className="upload-action-btn remove">Remove</button>
                </div>
              </div>
            ) : (
              <div className="motion-thumbnail-drop" onClick={() => document.getElementById('featuredImage').click()}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <span>Choose thumbnail</span>
              </div>
            )}
            <input type="file" id="featuredImage" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      <div className="form-actions motion-actions">
        <button type="button" onClick={handleDiscard} className="discard-btn" disabled={loading}>Discard</button>
        <div className="motion-actions-right">
          <button type="button" onClick={() => handleMotionSubmit('draft')} className="draft-btn" disabled={loading || !motionData.title || !motionData.excerpt}>
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="button" onClick={() => handleMotionSubmit('pending')} className="submit-btn" disabled={loading || !motionData.title || !motionData.excerpt || (!motionData.videoFile && !existingVideoUrl) || !motionData.type || (uploadProgress !== null && !uploadComplete)}>
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStory;

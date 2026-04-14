import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articleService, storageService, validateFirestorePayload, sanitizePayload } from '../firebase/services';
import { useNotification } from '../components/common/NotificationSystem';
import TiptapEditor from '../components/TiptapEditor';
import './CreateStory.css';

const EditArticle = () => {
  const { currentUser, userData } = useAuth();
  const { success, error: showError } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      // Upload inline base64 images to Storage before Firestore write
      const { html: cleanContent, json: cleanJSON } = await storageService.uploadContentImages(
        storyData.content || '',
        storyData.contentJSON || null
      );

      const updateData = {
        title: storyData.title || 'Untitled Story',
        excerpt: storyData.subtitle || '',
        authorName: storyData.authorName || article.authorName || '',
        content: cleanContent,
        category: storyData.category || article.category || 'word',
        featuredImage: featuredImageUrl,
        thumbnailCaption: storyData.thumbnailCaption || '',
        sourceText: storyData.sourceText || '',
        tags: storyData.tags || article.tags || [],
        status: storyData.status,
        isVisualStory: true,
      };
      if (cleanJSON) {
        updateData.contentJSON = typeof cleanJSON === 'string' ? cleanJSON : JSON.stringify(cleanJSON);
      }
      if (article.status === 'needs-revision' && storyData.status === 'pending') {
        updateData.isRevised = true;
        updateData.revisionNote = '';
      }

      // Sanitize: remove File/Blob/undefined before Firestore write
      const sanitized = sanitizePayload(updateData);

      // Validate: check for remaining invalid values
      const issues = validateFirestorePayload(sanitized);
      if (issues.length > 0) {
        console.error('[EditArticle] Payload validation issues:', issues);
        if (sanitized.contentJSON) {
          try {
            const parsed = JSON.parse(sanitized.contentJSON);
            const jsonIssues = validateFirestorePayload(parsed, 'contentJSON(parsed)');
            if (jsonIssues.length > 0) {
              console.error('[EditArticle] contentJSON internal issues:', jsonIssues);
            }
          } catch (e) {
            console.error('[EditArticle] contentJSON is not valid JSON:', e.message);
          }
        }
        const jsonStr = sanitized.contentJSON || '';
        const base64Count = (jsonStr.match(/data:image\//g) || []).length;
        if (base64Count > 0) {
          showError(`Save blocked: ${base64Count} image(s) failed to upload. Please try again.`);
          return;
        }
      }

      console.log('[EditArticle] Final payload size:', JSON.stringify(sanitized).length, 'bytes');

      await articleService.updateArticle(id, sanitized);
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

  if (loading) {
    return <div className="create-story-container"><div className="loading-state">Loading article...</div></div>;
  }
  if (error && !article) {
    return <div className="create-story-container"><div className="error-message">{error}</div></div>;
  }

  const isMotion = article.isMotion || article.category === 'motion';

  // Motion edits use the new Motion uploader in edit mode
  if (isMotion) {
    navigate(`/create-story?category=motion&edit=${id}`, { replace: true });
    return null;
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
    thumbnailCaption: article.thumbnailCaption || '',
    sourceText: article.sourceText || '',
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

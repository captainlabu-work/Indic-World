import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import ResizableImage from './ResizableImage';
import ImageGrid from './ImageGrid';
import { useRef, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/core';
import './TiptapEditor.css';

const DRAFT_KEY = 'indic-editor-draft';

// Extension: ensure an empty paragraph exists at the top when the first node is non-text
const EnsureTopParagraph = Extension.create({
  name: 'ensureTopParagraph',
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('ensureTopParagraph'),
        appendTransaction(_transactions, _oldState, newState) {
          const { doc, schema } = newState;
          const firstNode = doc.firstChild;
          if (firstNode && firstNode.type.name !== 'paragraph' && firstNode.type.name !== 'heading') {
            const paragraph = schema.nodes.paragraph.create();
            return newState.tr.insert(0, paragraph);
          }
          return null;
        },
      }),
    ];
  },
});

// Read saved draft once (outside component to avoid re-reads)
function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Toolbar button component
const ToolbarBtn = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    className={`te-toolbar-btn ${active ? 'active' : ''}`}
    onClick={onClick}
    disabled={disabled}
    title={title}
  >
    {children}
  </button>
);

const TAG_OPTIONS = [
  'Art & Culture',
  'Society & Politics',
  'History & Literature',
  'Camera & Cinema',
  'Science & Tech',
  'Travel & Places',
  'Philosophy & Religion',
];

const TiptapEditor = ({ onSave, onSaveDraft, initialContent = '', initialData = null, category: categoryProp = 'word', authorName: initialAuthor = '' }) => {
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const saveTimerRef = useRef(null);
  const isEditMode = !!initialData;
  const draft = useRef(isEditMode ? null : loadDraft());
  const navigate = useNavigate();

  // Controlled state for title/subtitle/author (restorable from draft or initialData)
  const [title, setTitle] = useState(initialData?.title || draft.current?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || draft.current?.subtitle || '');
  const [authorName, setAuthorName] = useState(initialData?.authorName || draft.current?.authorName || initialAuthor);

  // Article Settings state
  const [category, setCategory] = useState(initialData?.category || draft.current?.category || categoryProp);
  const [tags, setTags] = useState(initialData?.tags || draft.current?.tags || []);
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || initialData?.featuredImage || null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailCaption, setThumbnailCaption] = useState(initialData?.thumbnailCaption || draft.current?.thumbnailCaption || '');
  const [sourceText, setSourceText] = useState(initialData?.sourceText || draft.current?.sourceText || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ref that always holds the latest field values for the debounced save
  const fieldsRef = useRef({ title: '', subtitle: '', authorName: '' });
  fieldsRef.current = { title, subtitle, authorName };

  // Resolve initial editor content: initialData (edit mode) > draft > fallback
  const resolvedContent = (() => {
    if (initialData) {
      if (initialData.contentJSON) return typeof initialData.contentJSON === 'string' ? JSON.parse(initialData.contentJSON) : initialData.contentJSON;
      if (initialData.content) return initialData.content;
      return '';
    }
    return draft.current?.contentJSON || initialContent || '';
  })();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ResizableImage,
      ImageGrid,
      Placeholder.configure({
        placeholder: 'Start writing your story...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      EnsureTopParagraph,
    ],
    content: resolvedContent,
    editorProps: {
      attributes: {
        class: 'te-editor-content',
      },
    },
  });

  // --- Autosave logic (only for new stories, not edit mode) ---
  const saveDraftToStorage = useCallback(() => {
    if (!editor || isEditMode || draftCleared.current) return;
    const data = {
      ...fieldsRef.current,
      contentJSON: editor.getJSON(),
      category,
      tags,
      thumbnailCaption,
      sourceText,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      // localStorage quota exceeded — silently ignore
    }
  }, [editor, category, tags, thumbnailCaption, sourceText, isEditMode]);

  const scheduleSave = useCallback(() => {
    if (isEditMode) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveDraftToStorage, 2000);
  }, [saveDraftToStorage, isEditMode]);

  // Save on editor content change
  useEffect(() => {
    if (!editor || isEditMode) return;
    const handler = () => scheduleSave();
    editor.on('update', handler);
    return () => editor.off('update', handler);
  }, [editor, scheduleSave, isEditMode]);

  // Save on field change
  useEffect(() => {
    if (!isEditMode) scheduleSave();
  }, [title, subtitle, authorName, thumbnailCaption, sourceText, scheduleSave, isEditMode]);

  // Cleanup timer on unmount — flush final save only if draft wasn't cleared
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (isEditMode) return;
      if (draftCleared.current) return; // Don't re-save after discard/save/submit
      // Final save on unmount (preserves work during navigation/refresh)
      if (editor && !editor.isDestroyed) {
        const data = {
          ...fieldsRef.current,
          contentJSON: editor.getJSON(),
          category,
          tags,
          thumbnailCaption,
          sourceText,
          savedAt: Date.now(),
        };
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        } catch {}
      }
    };
  }, [editor, category, tags, thumbnailCaption, sourceText, isEditMode]);

  // Flag: when true, unmount should NOT re-save to localStorage
  const draftCleared = useRef(false);

  const clearDraft = useCallback(() => {
    draftCleared.current = true;
    localStorage.removeItem(DRAFT_KEY);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  // Inline toast state
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Image upload handler
  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || !editor) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const maxW = 1200;
        const scale = Math.min(maxW / img.width, 1);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL('image/jpeg', 0.85);

        editor.chain().focus().setResizableImage({ src: url }).run();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [editor]);

  // Thumbnail upload handler
  const handleThumbnailSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setThumbnailFile(file);
    setThumbnail(URL.createObjectURL(file));
    e.target.value = '';
  }, []);

  const removeThumbnail = useCallback(() => {
    setThumbnail(null);
    setThumbnailFile(null);
  }, []);

  // Tag toggle (max 2)
  const toggleTag = useCallback((tag) => {
    setTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag);
      if (prev.length >= 2) return prev;
      return [...prev, tag];
    });
  }, []);

  // Save handlers
  const buildPayload = (status) => ({
    title,
    subtitle,
    authorName,
    content: editor?.getHTML() || '',
    contentJSON: editor?.getJSON() || null,
    category,
    tags,
    coverImage: '',
    thumbnailFile,
    thumbnailCaption,
    sourceText,
    status,
  });

  // Discard handler
  const handleDiscard = () => {
    if (!isEditMode) clearDraft();
    navigate('/profile');
  };

  const handlePublish = () => {
    if (!title) return;
    showToast('Saving...');
    const payload = buildPayload('pending');
    clearDraft();
    onSave?.(payload);
  };

  const handleDraft = () => {
    showToast('Saving...');
    const payload = buildPayload('draft');
    clearDraft();
    onSaveDraft?.(payload);
  };

  if (!editor) return null;

  return (
    <div className="tiptap-editor">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} hidden />
      <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailSelect} hidden />

      {/* Top Bar */}
      <header className="te-topbar">
        <div className="te-topbar-left">
          {/* Home icon */}
          <button className="te-nav-btn" onClick={() => navigate('/')} title="Home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </button>
          {/* Profile / Dashboard icon */}
          <button className="te-nav-btn" onClick={() => navigate('/profile')} title="Dashboard">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
        </div>
        <div className="te-topbar-actions">
          <button className="te-btn te-btn-discard" onClick={handleDiscard}>Discard</button>
          {onSaveDraft && (
            <button className="te-btn te-btn-draft" onClick={handleDraft}>Save Draft</button>
          )}
          <button className="te-btn te-btn-publish" onClick={handlePublish} disabled={!title && !editor.getText()}>
            Submit for Review
          </button>
          {/* Settings toggle */}
          <button
            className={`te-nav-btn te-settings-toggle ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(prev => !prev)}
            title="Article Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Inline toast notification */}
      {toast && (
        <div className="te-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          {toast}
        </div>
      )}

      {/* Canvas */}
      <div className="te-canvas">
       <div className="te-editor-card">
        {/* Byline */}
        <div className="te-byline">
          <span>By </span>
          <input
            type="text"
            className="te-author-input"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your Name"
          />
          <span> | </span>
          <span className="te-date">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Title */}
        <input
          type="text"
          className="te-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Story Title"
        />

        {/* Subtitle */}
        <input
          type="text"
          className="te-subtitle-input"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="A short subtitle or tagline"
        />

        {/* Toolbar */}
        <div className="te-toolbar">
          <div className="te-toolbar-group">
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Italic (Ctrl+I)"
            >
              <em>I</em>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              title="Underline (Ctrl+U)"
            >
              <u>U</u>
            </ToolbarBtn>
          </div>

          <div className="te-toolbar-divider" />

          <div className="te-toolbar-group">
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Heading"
            >
              H2
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title="Subheading"
            >
              H3
            </ToolbarBtn>
          </div>

          <div className="te-toolbar-divider" />

          <div className="te-toolbar-group">
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              title="Quote"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
              </svg>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Bullet List"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/>
                <circle cx="5" cy="6" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="18" r="1" fill="currentColor"/>
              </svg>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Numbered List"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="10" y1="6" x2="20" y2="6"/><line x1="10" y1="12" x2="20" y2="12"/><line x1="10" y1="18" x2="20" y2="18"/>
                <text x="3" y="8" fill="currentColor" stroke="none" fontSize="7" fontWeight="600">1</text>
                <text x="3" y="14" fill="currentColor" stroke="none" fontSize="7" fontWeight="600">2</text>
                <text x="3" y="20" fill="currentColor" stroke="none" fontSize="7" fontWeight="600">3</text>
              </svg>
            </ToolbarBtn>
          </div>

          <div className="te-toolbar-divider" />

          <div className="te-toolbar-group">
            <ToolbarBtn
              onClick={handleImageUpload}
              title="Add Image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().insertImageGrid(2).run()}
              title="2-Column Images"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="9" height="18" rx="1.5"/>
                <rect x="13" y="3" width="9" height="18" rx="1.5"/>
              </svg>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().insertImageGrid(3).run()}
              title="3-Column Images"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="3" width="6" height="18" rx="1"/>
                <rect x="9" y="3" width="6" height="18" rx="1"/>
                <rect x="17" y="3" width="6" height="18" rx="1"/>
              </svg>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Divider"
            >
              &mdash;
            </ToolbarBtn>
          </div>

          <div className="te-toolbar-divider" />

          <div className="te-toolbar-group">
            <ToolbarBtn
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
              title="Align Left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
              </svg>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
              title="Align Center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
              </svg>
            </ToolbarBtn>
          </div>

          <div className="te-toolbar-divider" />

          <div className="te-toolbar-group">
            <ToolbarBtn
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H9" strokeLinecap="round"/><path d="M7 6l-4 4 4 4"/>
              </svg>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h4" strokeLinecap="round"/><path d="M17 6l4 4-4 4"/>
              </svg>
            </ToolbarBtn>
          </div>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />
       </div>
      </div>

      {/* Article Settings Sidebar */}
      {sidebarOpen && <div className="te-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`te-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="te-sidebar-header">
          <h3>Article Settings</h3>
          <button className="te-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="te-sidebar-body">
          {/* Category */}
          <div className="te-sidebar-field">
            <label className="te-sidebar-label">Category</label>
            <select
              className="te-sidebar-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="word">Word</option>
              <option value="lens">Lens</option>
              <option value="motion">Motion</option>
            </select>
          </div>

          {/* Tags */}
          <div className="te-sidebar-field">
            <label className="te-sidebar-label">
              Tags
              <span className="te-sidebar-hint">{tags.length}/2</span>
            </label>
            <div className="te-tag-grid">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`te-tag-chip ${tags.includes(tag) ? 'selected' : ''} ${tags.length >= 2 && !tags.includes(tag) ? 'disabled' : ''}`}
                  onClick={() => toggleTag(tag)}
                  disabled={tags.length >= 2 && !tags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="te-sidebar-field">
            <label className="te-sidebar-label">Thumbnail</label>
            <p className="te-sidebar-desc">Used for article cards and previews.</p>
            {thumbnail ? (
              <div className="te-thumbnail-preview">
                <img src={thumbnail} alt="Thumbnail preview" />
                <button className="te-thumbnail-remove" onClick={removeThumbnail} title="Remove thumbnail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ) : (
              <button
                className="te-thumbnail-upload"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                Upload image
              </button>
            )}
            <input
              type="text"
              className="te-sidebar-input"
              placeholder="Image caption (optional)"
              value={thumbnailCaption}
              onChange={(e) => setThumbnailCaption(e.target.value)}
            />
          </div>

          {/* Source */}
          <div className="te-sidebar-field">
            <label className="te-sidebar-label">Source</label>
            <p className="te-sidebar-desc">Credit the original source of this work.</p>
            <input
              type="text"
              className="te-sidebar-input"
              placeholder='e.g. "War and Peace" by Leo Tolstoy'
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
            />
          </div>
        </div>
      </aside>
    </div>
  );
};

export default TiptapEditor;

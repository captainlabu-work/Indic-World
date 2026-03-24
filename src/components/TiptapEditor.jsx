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

const TiptapEditor = ({ onSave, onSaveDraft, initialContent = '', category = 'word', authorName: initialAuthor = '' }) => {
  const fileInputRef = useRef(null);
  const saveTimerRef = useRef(null);
  const draft = useRef(loadDraft());
  const navigate = useNavigate();

  // Controlled state for title/subtitle/author (restorable from draft)
  const [title, setTitle] = useState(draft.current?.title || '');
  const [subtitle, setSubtitle] = useState(draft.current?.subtitle || '');
  const [authorName, setAuthorName] = useState(draft.current?.authorName || initialAuthor);

  // Ref that always holds the latest field values for the debounced save
  const fieldsRef = useRef({ title: '', subtitle: '', authorName: '' });
  fieldsRef.current = { title, subtitle, authorName };

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
    content: draft.current?.contentJSON || initialContent || '',
    editorProps: {
      attributes: {
        class: 'te-editor-content',
      },
    },
  });

  // --- Autosave logic ---
  const saveDraftToStorage = useCallback(() => {
    if (!editor) return;
    const data = {
      ...fieldsRef.current,
      contentJSON: editor.getJSON(),
      category,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      // localStorage quota exceeded — silently ignore
    }
  }, [editor, category]);

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveDraftToStorage, 2000);
  }, [saveDraftToStorage]);

  // Save on editor content change
  useEffect(() => {
    if (!editor) return;
    const handler = () => scheduleSave();
    editor.on('update', handler);
    return () => editor.off('update', handler);
  }, [editor, scheduleSave]);

  // Save on field change
  useEffect(() => {
    scheduleSave();
  }, [title, subtitle, authorName, scheduleSave]);

  // Cleanup timer on unmount — flush final save
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      // Final save on unmount
      if (editor && !editor.isDestroyed) {
        const data = {
          ...fieldsRef.current,
          contentJSON: editor.getJSON(),
          category,
          savedAt: Date.now(),
        };
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        } catch {}
      }
    };
  }, [editor, category]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
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

  // Save handlers
  const buildPayload = (status) => ({
    title,
    subtitle,
    authorName,
    content: editor?.getHTML() || '',
    contentJSON: editor?.getJSON() || null,
    category,
    coverImage: '',
    status,
  });

  const handlePublish = () => {
    if (!title) return;
    clearDraft();
    onSave?.(buildPayload('pending'));
  };

  const handleDraft = () => {
    clearDraft();
    onSaveDraft?.(buildPayload('draft'));
  };

  if (!editor) return null;

  return (
    <div className="tiptap-editor">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} hidden />

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
          {onSaveDraft && (
            <button className="te-btn te-btn-draft" onClick={handleDraft}>Save Draft</button>
          )}
          <button className="te-btn te-btn-publish" onClick={handlePublish} disabled={!title && !editor.getText()}>
            Submit for Review
          </button>
        </div>
      </header>

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
    </div>
  );
};

export default TiptapEditor;

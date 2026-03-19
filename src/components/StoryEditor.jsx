import { useState, useRef, useCallback } from 'react';
import './StoryEditor.css';

// Default template that opens when editor loads
const DEFAULT_TEMPLATE = [
  {
    id: 'block-1',
    type: 'image',
    variant: 'hero',
    content: { image: null, caption: '' }
  },
  {
    id: 'block-2',
    type: 'title',
    content: { text: '' }
  },
  {
    id: 'block-3',
    type: 'subtitle',
    content: { text: '' }
  },
  {
    id: 'block-4',
    type: 'text',
    content: { text: '' }
  },
  {
    id: 'block-5',
    type: 'image',
    variant: 'normal',
    content: { image: null, caption: '' }
  },
  {
    id: 'block-6',
    type: 'text',
    content: { text: '' }
  },
  {
    id: 'block-7',
    type: 'divider',
    content: {}
  },
  {
    id: 'block-8',
    type: 'quote',
    content: { text: '', author: '' }
  },
  {
    id: 'block-9',
    type: 'text',
    content: { text: '' }
  }
];

// Image size presets
const IMAGE_SIZES = {
  hero: { width: 1920, height: 1080, label: 'Hero (16:9)' },
  normal: { width: 1200, height: 900, label: 'Normal (4:3)' },
  portrait: { width: 900, height: 1200, label: 'Portrait (3:4)' },
  full: { width: 1920, height: 1080, label: 'Full Width (16:9)' }
};

const BLOCK_TYPES = [
  { type: 'title', label: 'Title', icon: 'T' },
  { type: 'subtitle', label: 'Subtitle', icon: 'Tt' },
  { type: 'text', label: 'Text', icon: '\u00b6' },
  { type: 'image', label: 'Image', icon: null, isSvg: true },
  { type: 'image-caption', label: 'Image + Caption', icon: null, isSvg: true },
  { type: 'image-full', label: 'Full Width Image', icon: null, isSvg: true },
  { type: 'quote', label: 'Quote', icon: '\u201c' },
  { type: 'divider', label: 'Divider', icon: '\u2014' }
];

const StoryEditor = ({ onSave, onSaveDraft, initialData = null, category = 'word' }) => {
  const [blocks, setBlocks] = useState(initialData?.blocks || DEFAULT_TEMPLATE);
  const [authorName, setAuthorName] = useState(initialData?.authorName || '');
  const [showAddMenu, setShowAddMenu] = useState(null); // index where to insert
  const [activeBlock, setActiveBlock] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const activeImageBlockRef = useRef(null);

  // Get title and subtitle from blocks
  const getTitle = () => {
    const titleBlock = blocks.find(b => b.type === 'title');
    return titleBlock?.content?.text || '';
  };

  const getSubtitle = () => {
    const subtitleBlock = blocks.find(b => b.type === 'subtitle');
    return subtitleBlock?.content?.text || '';
  };

  // Get first image as cover
  const getCoverImage = () => {
    const imgBlock = blocks.find(b => (b.type === 'image' || b.type === 'image-caption' || b.type === 'image-full') && b.content?.image);
    return imgBlock?.content?.image || '';
  };

  // Update a block's content
  const updateBlock = useCallback((blockId, updates) => {
    setBlocks(prev => prev.map(block =>
      block.id === blockId
        ? { ...block, content: { ...block.content, ...updates } }
        : block
    ));
  }, []);

  // Update block variant (image size)
  const updateBlockVariant = useCallback((blockId, variant) => {
    setBlocks(prev => prev.map(block =>
      block.id === blockId ? { ...block, variant } : block
    ));
  }, []);

  // Delete a block
  const deleteBlock = useCallback((blockId) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
  }, []);

  // Add a block after a given index
  const addBlockAt = useCallback((index, type) => {
    let newBlock;
    const id = `block-${Date.now()}`;

    switch (type) {
      case 'title':
        newBlock = { id, type: 'title', content: { text: '' } };
        break;
      case 'subtitle':
        newBlock = { id, type: 'subtitle', content: { text: '' } };
        break;
      case 'text':
        newBlock = { id, type: 'text', content: { text: '' } };
        break;
      case 'image':
        newBlock = { id, type: 'image', variant: 'normal', content: { image: null, caption: '' } };
        break;
      case 'image-caption':
        newBlock = { id, type: 'image-caption', variant: 'normal', content: { image: null, caption: '' } };
        break;
      case 'image-full':
        newBlock = { id, type: 'image-full', variant: 'full', content: { image: null, caption: '' } };
        break;
      case 'quote':
        newBlock = { id, type: 'quote', content: { text: '', author: '' } };
        break;
      case 'divider':
        newBlock = { id, type: 'divider', content: {} };
        break;
      default:
        return;
    }

    setBlocks(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, newBlock);
      return updated;
    });
    setShowAddMenu(null);
  }, []);

  // Move block up/down
  const moveBlock = useCallback((blockId, direction) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === blockId);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const updated = [...prev];
      [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
      return updated;
    });
  }, []);

  // Handle image upload
  const handleImageUpload = (blockId, file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Get target size based on block variant
        const block = blocks.find(b => b.id === blockId);
        const variant = block?.variant || 'normal';
        const target = IMAGE_SIZES[variant] || IMAGE_SIZES.normal;

        // Resize while keeping aspect ratio
        const canvas = document.createElement('canvas');
        const ratio = Math.min(target.width / img.width, target.height / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const resizedUrl = canvas.toDataURL('image/jpeg', 0.85);
        updateBlock(blockId, { image: resizedUrl });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const triggerImageUpload = (blockId) => {
    activeImageBlockRef.current = blockId;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && activeImageBlockRef.current) {
      handleImageUpload(activeImageBlockRef.current, file);
    }
    e.target.value = '';
  };

  // Save handlers
  const handlePublish = async () => {
    setSaving(true);
    try {
      await onSave({
        blocks,
        authorName,
        title: getTitle(),
        subtitle: getSubtitle(),
        coverImage: getCoverImage(),
        category
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await onSaveDraft?.({
        blocks,
        authorName,
        title: getTitle(),
        subtitle: getSubtitle(),
        coverImage: getCoverImage(),
        category
      });
    } finally {
      setSaving(false);
    }
  };

  // Render individual blocks
  const renderBlock = (block, index) => {
    const isActive = activeBlock === block.id;

    switch (block.type) {
      case 'title':
        return (
          <div className="se-block se-block-title" key={block.id}>
            <input
              type="text"
              className="se-title-input"
              value={block.content.text}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              placeholder="Story Title"
            />
          </div>
        );

      case 'subtitle':
        return (
          <div className="se-block se-block-subtitle" key={block.id}>
            <input
              type="text"
              className="se-subtitle-input"
              value={block.content.text}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              placeholder="A short subtitle or tagline"
            />
          </div>
        );

      case 'text':
        return (
          <div className="se-block se-block-text" key={block.id}>
            <textarea
              className="se-text-input"
              value={block.content.text}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              placeholder="Write your story here..."
              rows={4}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>
        );

      case 'image':
      case 'image-caption':
      case 'image-full':
        return (
          <div
            className={`se-block se-block-image ${block.type === 'image-full' ? 'se-full-width' : ''}`}
            key={block.id}
          >
            {block.content.image ? (
              <div className="se-image-wrapper">
                <img
                  src={block.content.image}
                  alt=""
                  className={`se-image se-image-${block.variant || 'normal'}`}
                  loading="lazy"
                />
                <button
                  className="se-image-replace"
                  onClick={() => triggerImageUpload(block.id)}
                >
                  Replace
                </button>
              </div>
            ) : (
              <div
                className={`se-image-placeholder se-placeholder-${block.variant || 'normal'}`}
                onClick={() => triggerImageUpload(block.id)}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Click to add image</span>
                <span className="se-size-hint">
                  {IMAGE_SIZES[block.variant || 'normal']?.label || 'Normal'}
                </span>
              </div>
            )}
            {/* Caption for image-caption type or when there's a caption */}
            {(block.type === 'image-caption' || block.content.caption) && (
              <input
                type="text"
                className="se-image-caption"
                value={block.content.caption}
                onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                placeholder="Add a caption..."
              />
            )}
            {/* Image size selector */}
            {isActive && block.type !== 'image-full' && (
              <div className="se-image-sizes">
                {Object.entries(IMAGE_SIZES).filter(([k]) => k !== 'full').map(([key, val]) => (
                  <button
                    key={key}
                    className={`se-size-btn ${(block.variant || 'normal') === key ? 'active' : ''}`}
                    onClick={() => updateBlockVariant(block.id, key)}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'quote':
        return (
          <div className="se-block se-block-quote" key={block.id}>
            <div className="se-quote-mark">"</div>
            <textarea
              className="se-quote-input"
              value={block.content.text}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              placeholder="Enter a quote..."
              rows={2}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
            <input
              type="text"
              className="se-quote-author"
              value={block.content.author}
              onChange={(e) => updateBlock(block.id, { author: e.target.value })}
              placeholder="- Author name"
            />
          </div>
        );

      case 'divider':
        return (
          <div className="se-block se-block-divider" key={block.id}>
            <hr className="se-divider" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="story-editor">
      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        hidden
      />

      {/* Top Bar */}
      <header className="se-topbar">
        <button className="se-back-btn" onClick={() => window.history.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="se-topbar-actions">
          {onSaveDraft && (
            <button
              className="se-btn se-btn-draft"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          <button
            className="se-btn se-btn-publish"
            onClick={handlePublish}
            disabled={saving || !getTitle()}
          >
            {saving ? 'Publishing...' : 'Submit for Review'}
          </button>
        </div>
      </header>

      {/* Story Canvas */}
      <div className="se-canvas">
        {/* Byline */}
        <div className="se-byline">
          <span className="se-by">By </span>
          <input
            type="text"
            className="se-author-input"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your Name"
          />
          <span className="se-separator"> | </span>
          <span className="se-date">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Blocks */}
        <div className="se-blocks">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              className={`se-block-wrapper ${activeBlock === block.id ? 'active' : ''}`}
              onClick={() => setActiveBlock(block.id)}
            >
              {/* Block controls - visible on hover */}
              <div className="se-block-controls">
                <button
                  className="se-ctrl-btn"
                  onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                  disabled={index === 0}
                  title="Move up"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  className="se-ctrl-btn"
                  onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                  disabled={index === blocks.length - 1}
                  title="Move down"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  className="se-ctrl-btn se-ctrl-delete"
                  onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                  title="Delete block"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {renderBlock(block, index)}

              {/* Add block button between blocks */}
              <div className="se-add-between">
                <button
                  className="se-add-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddMenu(showAddMenu === index ? null : index);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>

                {showAddMenu === index && (
                  <div className="se-add-menu">
                    {BLOCK_TYPES.map(bt => (
                      <button
                        key={bt.type}
                        className="se-add-menu-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          addBlockAt(index, bt.type);
                        }}
                      >
                        <span className="se-menu-icon">
                          {bt.isSvg ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                              <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          ) : bt.icon}
                        </span>
                        <span>{bt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoryEditor;

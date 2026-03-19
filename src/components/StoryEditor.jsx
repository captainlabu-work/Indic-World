import { useState, useRef, useCallback } from 'react';
import './StoryEditor.css';

// Default template — opens pre-filled so user edits existing blocks
const DEFAULT_TEMPLATE = [
  {
    id: 'block-1',
    type: 'image-full',
    content: { image: null, caption: '', credit: '' }
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
    type: 'image-pair',
    content: {
      left: { image: null, caption: '', credit: '' },
      right: { image: null, caption: '', credit: '' }
    }
  },
  {
    id: 'block-6',
    type: 'text',
    content: { text: '' }
  },
  {
    id: 'block-7',
    type: 'image-centered',
    content: { image: null, caption: '', credit: '' }
  },
  {
    id: 'block-8',
    type: 'text',
    content: { text: '' }
  },
  {
    id: 'block-9',
    type: 'divider',
    content: {}
  },
  {
    id: 'block-10',
    type: 'quote',
    content: { text: '', author: '' }
  },
  {
    id: 'block-11',
    type: 'image-pair',
    content: {
      left: { image: null, caption: '', credit: '' },
      right: { image: null, caption: '', credit: '' }
    }
  }
];

// Max resize dimensions per context
const MAX_WIDTHS = {
  full: 1920,
  pair: 600,
  bigSmallBig: 900,
  bigSmallSmall: 500,
  centered: 900
};

// Block type menu items
const BLOCK_TYPES = [
  { type: 'title', label: 'Title', icon: 'T' },
  { type: 'subtitle', label: 'Subtitle', icon: 'Tt' },
  { type: 'text', label: 'Text', icon: '\u00b6' },
  { type: 'image-full', label: 'Full Width Image', desc: '12 columns' },
  { type: 'image-pair', label: 'Two Images', desc: '6 + 6 columns' },
  { type: 'image-big-small', label: 'Big + Small', desc: '8 + 4 columns' },
  { type: 'image-centered', label: 'Centered Image', desc: '8 columns' },
  { type: 'quote', label: 'Quote', icon: '\u201c' },
  { type: 'divider', label: 'Divider', icon: '\u2014' }
];

const IMG_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const StoryEditor = ({ onSave, onSaveDraft, initialData = null, category = 'word' }) => {
  const [blocks, setBlocks] = useState(initialData?.blocks || DEFAULT_TEMPLATE);
  const [authorName, setAuthorName] = useState(initialData?.authorName || '');
  const [showAddMenu, setShowAddMenu] = useState(null);
  const [activeBlock, setActiveBlock] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const imageTargetRef = useRef(null); // { blockId, slot } — slot: null for single, 'left'/'right' for pairs

  // Helpers to extract title/subtitle/cover from blocks
  const getTitle = () => blocks.find(b => b.type === 'title')?.content?.text || '';
  const getSubtitle = () => blocks.find(b => b.type === 'subtitle')?.content?.text || '';

  const getCoverImage = () => {
    for (const b of blocks) {
      if (b.type === 'image-full' || b.type === 'image-centered') {
        if (b.content?.image) return b.content.image;
      }
      if (b.type === 'image-pair' || b.type === 'image-big-small') {
        if (b.content?.left?.image) return b.content.left.image;
        if (b.content?.right?.image) return b.content.right.image;
      }
    }
    return '';
  };

  // === Block mutations ===

  const updateBlock = useCallback((blockId, updates) => {
    setBlocks(prev => prev.map(block =>
      block.id === blockId
        ? { ...block, content: { ...block.content, ...updates } }
        : block
    ));
  }, []);

  // Update a slot inside a pair/big-small block
  const updateSlot = useCallback((blockId, slot, updates) => {
    setBlocks(prev => prev.map(block => {
      if (block.id !== blockId) return block;
      return {
        ...block,
        content: {
          ...block.content,
          [slot]: { ...block.content[slot], ...updates }
        }
      };
    }));
  }, []);

  const deleteBlock = useCallback((blockId) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
  }, []);

  const moveBlock = useCallback((blockId, dir) => {
    setBlocks(prev => {
      const i = prev.findIndex(b => b.id === blockId);
      if (i === -1) return prev;
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const a = [...prev];
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });
  }, []);

  const addBlockAt = useCallback((index, type) => {
    const id = `block-${Date.now()}`;
    let newBlock;

    switch (type) {
      case 'title':
        newBlock = { id, type, content: { text: '' } }; break;
      case 'subtitle':
        newBlock = { id, type, content: { text: '' } }; break;
      case 'text':
        newBlock = { id, type, content: { text: '' } }; break;
      case 'image-full':
        newBlock = { id, type, content: { image: null, caption: '', credit: '' } }; break;
      case 'image-centered':
        newBlock = { id, type, content: { image: null, caption: '', credit: '' } }; break;
      case 'image-pair':
      case 'image-big-small':
        newBlock = {
          id, type,
          content: {
            left: { image: null, caption: '', credit: '' },
            right: { image: null, caption: '', credit: '' }
          }
        }; break;
      case 'quote':
        newBlock = { id, type, content: { text: '', author: '' } }; break;
      case 'divider':
        newBlock = { id, type, content: {} }; break;
      default: return;
    }

    setBlocks(prev => {
      const a = [...prev];
      a.splice(index + 1, 0, newBlock);
      return a;
    });
    setShowAddMenu(null);
  }, []);

  // === Image upload with auto-resize ===

  const resizeAndSet = (file, blockId, slot, maxW) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxW / img.width, 1);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL('image/jpeg', 0.85);
        if (slot) {
          updateSlot(blockId, slot, { image: url });
        } else {
          updateBlock(blockId, { image: url });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = (blockId, slot = null) => {
    imageTargetRef.current = { blockId, slot };
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !imageTargetRef.current) return;

    const { blockId, slot } = imageTargetRef.current;
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // Determine max width based on block type and slot
    let maxW = MAX_WIDTHS.full;
    if (block.type === 'image-pair') maxW = MAX_WIDTHS.pair;
    else if (block.type === 'image-big-small') maxW = slot === 'left' ? MAX_WIDTHS.bigSmallBig : MAX_WIDTHS.bigSmallSmall;
    else if (block.type === 'image-centered') maxW = MAX_WIDTHS.centered;

    resizeAndSet(file, blockId, slot, maxW);
    e.target.value = '';
  };

  // === Save ===

  const handlePublish = async () => {
    setSaving(true);
    try {
      await onSave({ blocks, authorName, title: getTitle(), subtitle: getSubtitle(), coverImage: getCoverImage(), category });
    } finally { setSaving(false); }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await onSaveDraft?.({ blocks, authorName, title: getTitle(), subtitle: getSubtitle(), coverImage: getCoverImage(), category });
    } finally { setSaving(false); }
  };

  // === Render helpers ===

  // Single image slot (used by full, centered, and inside pairs)
  const renderImageSlot = (blockId, data, slot = null, placeholderClass = '') => {
    if (data?.image) {
      return (
        <div className="se-img-slot">
          <img src={data.image} alt="" loading="lazy" />
          <button className="se-img-replace" onClick={() => triggerUpload(blockId, slot)}>Replace</button>
          <input
            type="text"
            className="se-caption"
            value={data.caption || ''}
            onChange={(e) => slot ? updateSlot(blockId, slot, { caption: e.target.value }) : updateBlock(blockId, { caption: e.target.value })}
            placeholder="Caption"
          />
          {(data.credit || slot) && (
            <input
              type="text"
              className="se-credit"
              value={data.credit || ''}
              onChange={(e) => slot ? updateSlot(blockId, slot, { credit: e.target.value }) : updateBlock(blockId, { credit: e.target.value })}
              placeholder="Credit"
            />
          )}
        </div>
      );
    }

    return (
      <div className={`se-img-placeholder ${placeholderClass}`} onClick={() => triggerUpload(blockId, slot)}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Click to add image</span>
      </div>
    );
  };

  // Render a single block
  const renderBlock = (block) => {
    switch (block.type) {
      case 'title':
        return (
          <div className="se-row se-row-text">
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
          <div className="se-row se-row-text">
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
          <div className="se-row se-row-text">
            <textarea
              className="se-text-input"
              value={block.content.text}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              placeholder="Write your story here..."
              rows={4}
              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
            />
          </div>
        );

      case 'image-full':
        return (
          <div className="se-row se-row-full">
            {renderImageSlot(block.id, block.content, null, 'se-ph-landscape')}
          </div>
        );

      case 'image-centered':
        return (
          <div className="se-row se-row-centered">
            {renderImageSlot(block.id, block.content, null, 'se-ph-landscape')}
          </div>
        );

      case 'image-pair':
        return (
          <div className="se-row se-row-pair">
            <div className="se-col-6">
              {renderImageSlot(block.id, block.content.left, 'left', 'se-ph-square')}
            </div>
            <div className="se-col-6">
              {renderImageSlot(block.id, block.content.right, 'right', 'se-ph-square')}
            </div>
          </div>
        );

      case 'image-big-small':
        return (
          <div className="se-row se-row-big-small">
            <div className="se-col-8">
              {renderImageSlot(block.id, block.content.left, 'left', 'se-ph-landscape')}
            </div>
            <div className="se-col-4">
              {renderImageSlot(block.id, block.content.right, 'right', 'se-ph-portrait')}
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="se-row se-row-text">
            <div className="se-quote-block">
              <div className="se-quote-mark">"</div>
              <textarea
                className="se-quote-input"
                value={block.content.text}
                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                placeholder="Enter a quote..."
                rows={2}
                onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              />
              <input
                type="text"
                className="se-quote-author"
                value={block.content.author}
                onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                placeholder="— Author name"
              />
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="se-row se-row-text">
            <hr className="se-divider" />
          </div>
        );

      default:
        return null;
    }
  };

  // Block type label for the add menu
  const getMenuIcon = (bt) => {
    if (bt.type.startsWith('image')) return IMG_ICON;
    return <span className="se-menu-char">{bt.icon}</span>;
  };

  return (
    <div className="story-editor">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} hidden />

      {/* Top Bar */}
      <header className="se-topbar">
        <button className="se-back-btn" onClick={() => window.history.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="se-topbar-actions">
          {onSaveDraft && (
            <button className="se-btn se-btn-draft" onClick={handleSaveDraft} disabled={saving}>
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
          )}
          <button className="se-btn se-btn-publish" onClick={handlePublish} disabled={saving || !getTitle()}>
            {saving ? 'Publishing...' : 'Submit for Review'}
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="se-canvas">
        {/* Byline */}
        <div className="se-byline">
          <span>By </span>
          <input
            type="text"
            className="se-author-input"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your Name"
          />
          <span className="se-sep"> | </span>
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
              {/* Controls */}
              <div className="se-block-controls">
                <button className="se-ctrl-btn" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} disabled={index === 0} title="Move up">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="se-ctrl-btn" onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} disabled={index === blocks.length - 1} title="Move down">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button className="se-ctrl-btn se-ctrl-delete" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} title="Delete">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </button>
              </div>

              {renderBlock(block)}

              {/* Add button */}
              <div className="se-add-between">
                <button
                  className="se-add-btn"
                  onClick={(e) => { e.stopPropagation(); setShowAddMenu(showAddMenu === index ? null : index); }}
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
                        onClick={(e) => { e.stopPropagation(); addBlockAt(index, bt.type); }}
                      >
                        <span className="se-menu-icon">{getMenuIcon(bt)}</span>
                        <div className="se-menu-label">
                          <span>{bt.label}</span>
                          {bt.desc && <small>{bt.desc}</small>}
                        </div>
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

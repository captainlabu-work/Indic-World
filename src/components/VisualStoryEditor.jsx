import { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './VisualStoryEditor.css';

const VisualStoryEditor = ({ onSave, initialData = null }) => {
  const [blocks, setBlocks] = useState(initialData?.blocks || []);
  const [title, setTitle] = useState(initialData?.title || 'Untitled Story');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [authorName, setAuthorName] = useState(initialData?.authorName || '');
  const [layout, setLayout] = useState(initialData?.layout || 'simple');
  const [showSidebar, setShowSidebar] = useState(false);
  const fileInputRef = useRef(null);

  // Simplified block types (Magnum Photos style)
  const blockTypes = {
    IMAGE: 'image',
    TEXT: 'text',
    QUOTE: 'quote'
  };

  // Add a new block
  const addBlock = (type) => {
    const newBlock = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type)
    };
    setBlocks([...blocks, newBlock]);
  };

  // Get default content for block type
  const getDefaultContent = (type) => {
    switch (type) {
      case blockTypes.IMAGE:
        return {
          image: null,
          caption: '',
          credit: ''
        };
      case blockTypes.TEXT:
        return {
          text: 'Start writing your story...'
        };
      case blockTypes.QUOTE:
        return {
          quote: 'Enter quote here',
          author: ''
        };
      default:
        return {};
    }
  };

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items);
  };

  // Update block content
  const updateBlock = (blockId, updates) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? { ...block, content: { ...block.content, ...updates } }
        : block
    ));
  };

  // Delete block
  const deleteBlock = (blockId) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
  };

  // Handle image upload for blocks
  const handleImageUpload = async (blockId, file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      updateBlock(blockId, { image: imageUrl });
    };
    reader.readAsDataURL(file);
  };

  // Render block based on type (Magnum Photos style - uniform widths)
  const renderBlock = (block) => {
    switch (block.type) {
      case blockTypes.IMAGE:
        return (
          <div className="block-image">
            {block.content.image ? (
              <>
                <div className="image-container">
                  <img src={block.content.image} alt="" />
                </div>
                <div className="image-meta">
                  <input
                    type="text"
                    className="image-caption"
                    value={block.content.caption}
                    onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                    placeholder="Caption (optional)"
                  />
                  <input
                    type="text"
                    className="image-credit"
                    value={block.content.credit}
                    onChange={(e) => updateBlock(block.id, { credit: e.target.value })}
                    placeholder="Photo credit (optional)"
                  />
                </div>
              </>
            ) : (
              <label className="image-upload-zone">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(block.id, e.target.files[0])}
                  hidden
                />
                <div className="upload-prompt">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Add Image</span>
                </div>
              </label>
            )}
          </div>
        );

      case blockTypes.TEXT:
        return (
          <div className="block-text">
            <div
              contentEditable
              className="text-content"
              onBlur={(e) => updateBlock(block.id, { text: e.target.innerHTML })}
              dangerouslySetInnerHTML={{ __html: block.content.text }}
            />
          </div>
        );

      case blockTypes.QUOTE:
        return (
          <div className="block-quote">
            <blockquote>
              <div
                contentEditable
                className="quote-text"
                onBlur={(e) => updateBlock(block.id, { quote: e.target.textContent })}
              >
                {block.content.quote}
              </div>
              {block.content.author && (
                <cite
                  contentEditable
                  onBlur={(e) => updateBlock(block.id, { author: e.target.textContent })}
                >
                  — {block.content.author}
                </cite>
              )}
            </blockquote>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="visual-story-editor">
      {/* Exposure.co Style Header */}
      <header className="editor-top-bar">
        <button className="back-btn" onClick={() => window.history.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="top-bar-actions">
          <button className="action-btn">PREVIEW</button>
          <button className="action-btn">SHARE DRAFT</button>
          <button className="action-btn">CATEGORIZE</button>
          <button className="action-btn">DELETE</button>
          <button className="action-btn">OPTIONS</button>
          <button className="action-btn save-draft">SAVE DRAFT</button>
          <button
            className="action-btn publish-btn"
            onClick={() => onSave({ title, subtitle, authorName, layout, blocks })}
          >
            UPGRADE TO PUBLISH
          </button>
        </div>
      </header>

      {/* Story Header */}
      <div className="story-header-section">
        <input
          type="text"
          className="story-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Story"
        />
        <input
          type="text"
          className="story-subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Type a subtitle"
        />
        <div className="story-byline">
          <span>By </span>
          <input
            type="text"
            className="story-author"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="AUTHOR NAME"
          />
          <span> | </span>
          <span className="story-date">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Layout Options (Exposure.co style) */}
      <div className="layout-controls">
        <div className="layout-label">LAYOUT</div>
        <div className="layout-options">
          <button
            className={`layout-btn ${layout === 'overlay' ? 'active' : ''}`}
            onClick={() => setLayout('overlay')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="2" width="20" height="20" rx="2"/>
            </svg>
            OVERLAY
          </button>
          <button
            className={`layout-btn ${layout === 'twofold' ? 'active' : ''}`}
            onClick={() => setLayout('twofold')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="2" width="9" height="20" rx="1"/>
              <rect x="13" y="2" width="9" height="20" rx="1"/>
            </svg>
            TWO FOLD
          </button>
          <button
            className={`layout-btn ${layout === 'simple' ? 'active' : ''}`}
            onClick={() => setLayout('simple')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="2" width="12" height="20" rx="1"/>
            </svg>
            SIMPLE
          </button>
        </div>
      </div>

      {/* Content Area with Sidebar Toggle */}
      <div className="editor-content-wrapper">
        {/* Add Block Sidebar */}
        <div className={`add-block-sidebar ${showSidebar ? 'visible' : ''}`}>
          <button className="close-sidebar" onClick={() => setShowSidebar(false)}>×</button>
          <h3>Add Content</h3>
          <div className="sidebar-blocks">
            <button onClick={() => { addBlock(blockTypes.IMAGE); setShowSidebar(false); }} className="sidebar-block-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Image</span>
            </button>
            <button onClick={() => { addBlock(blockTypes.TEXT); setShowSidebar(false); }} className="sidebar-block-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>Text</span>
            </button>
            <button onClick={() => { addBlock(blockTypes.QUOTE); setShowSidebar(false); }} className="sidebar-block-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Quote</span>
            </button>
          </div>
        </div>

        {/* Main Story Canvas (Magnum Photos style - uniform width) */}
        <div className="story-canvas">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="story-blocks">
              {(provided) => (
                <div
                  className="story-blocks-container"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {blocks.map((block, index) => (
                    <Draggable key={block.id} draggableId={block.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`story-block ${snapshot.isDragging ? 'dragging' : ''}`}
                        >
                          <div className="block-controls">
                            <div className="drag-handle" {...provided.dragHandleProps}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <circle cx="9" cy="5" r="1" fill="currentColor"/>
                                <circle cx="9" cy="12" r="1" fill="currentColor"/>
                                <circle cx="9" cy="19" r="1" fill="currentColor"/>
                                <circle cx="15" cy="5" r="1" fill="currentColor"/>
                                <circle cx="15" cy="12" r="1" fill="currentColor"/>
                                <circle cx="15" cy="19" r="1" fill="currentColor"/>
                              </svg>
                            </div>
                            <button
                              className="delete-block-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlock(block.id);
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                          {renderBlock(block)}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {/* Add Block Button */}
                  <div className="add-block-trigger">
                    <button
                      className="add-block-btn"
                      onClick={() => setShowSidebar(true)}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Add Content
                    </button>
                  </div>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Settings Sidebar (right) */}
        <div className="settings-sidebar">
          <button className="sidebar-toggle-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1v6m0 6v6m9.66-9.66l-5.2 3M7.54 14.66l-5.2 3m14.86 0l-5.2-3M7.54 9.34l-5.2-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualStoryEditor;
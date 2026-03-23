import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { useCallback, useRef, useState } from 'react';

// React component for the resizable image node view
const ImageNodeView = ({ node, updateAttributes, selected }) => {
  const { src, alt, width, layout, caption } = node.attrs;
  const containerRef = useRef(null);
  const [resizing, setResizing] = useState(false);

  const handleResize = useCallback((e) => {
    e.preventDefault();
    const container = containerRef.current?.closest('.te-editor-content') || containerRef.current?.parentElement;
    if (!container) return;

    const startX = e.clientX;
    const startWidth = containerRef.current.offsetWidth;
    const containerWidth = container.offsetWidth;

    setResizing(true);

    const onMouseMove = (moveEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(100, startWidth + diff);
      const percent = Math.round(Math.min((newWidth / containerWidth) * 100, 100));
      updateAttributes({ width: `${percent}%` });
    };

    const onMouseUp = () => {
      setResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [updateAttributes]);

  const setSize = useCallback((size) => {
    const sizes = { full: '100%', large: '75%', half: '50%', third: '33%' };
    updateAttributes({ width: sizes[size] || '100%' });
  }, [updateAttributes]);

  const setLayout = useCallback((newLayout) => {
    updateAttributes({ layout: newLayout });
  }, [updateAttributes]);

  return (
    <NodeViewWrapper
      className={`te-resizable-image ${layout || 'center'} ${selected ? 'selected' : ''} ${resizing ? 'resizing' : ''}`}
      style={{ width: width || '100%' }}
      ref={containerRef}
    >
      <img src={src} alt={alt || ''} draggable={false} />

      {/* Caption input — always visible under image */}
      <input
        type="text"
        className="te-image-caption"
        value={caption || ''}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        placeholder="Add a caption..."
      />

      {/* Drag grip handle */}
      <div className="te-drag-handle" data-drag-handle>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/>
          <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
          <circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/>
        </svg>
      </div>

      {/* Resize handle */}
      <div className="te-resize-handle te-resize-right" onMouseDown={handleResize} />

      {/* Size toolbar (shows on select) */}
      {selected && (
        <div className="te-image-toolbar">
          <div className="te-image-toolbar-group">
            <button
              type="button"
              className={`te-img-btn ${width === '100%' || !width ? 'active' : ''}`}
              onClick={() => setSize('full')}
              title="Full width"
            >
              Full
            </button>
            <button
              type="button"
              className={`te-img-btn ${width === '75%' ? 'active' : ''}`}
              onClick={() => setSize('large')}
              title="75% width"
            >
              Large
            </button>
            <button
              type="button"
              className={`te-img-btn ${width === '50%' ? 'active' : ''}`}
              onClick={() => setSize('half')}
              title="50% — use two for side by side"
            >
              Half
            </button>
            <button
              type="button"
              className={`te-img-btn ${width === '33%' ? 'active' : ''}`}
              onClick={() => setSize('third')}
              title="33% — use three in a row"
            >
              Third
            </button>
          </div>
          <span className="te-img-divider" />
          <div className="te-image-toolbar-group">
            <button
              type="button"
              className={`te-img-btn ${layout === 'left' ? 'active' : ''}`}
              onClick={() => setLayout('left')}
              title="Align left"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
              </svg>
            </button>
            <button
              type="button"
              className={`te-img-btn ${!layout || layout === 'center' ? 'active' : ''}`}
              onClick={() => setLayout('center')}
              title="Center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
              </svg>
            </button>
            <button
              type="button"
              className={`te-img-btn ${layout === 'right' ? 'active' : ''}`}
              onClick={() => setLayout('right')}
              title="Align right"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
};

// Custom Tiptap extension
const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: '100%' },
      layout: { default: 'center' },
      caption: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },

  addCommands() {
    return {
      setResizableImage: (attrs) => ({ chain }) => {
        return chain().insertContent({ type: this.name, attrs }).run();
      },
    };
  },
});

export default ResizableImage;

import { Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { useCallback, useRef, useState } from 'react';

// Per-cell resizable image component
const GridCell = ({ img, index, onFile, onCaption, onRemove, onResize }) => {
  const fileRef = useRef(null);
  const imgRef = useRef(null);
  const [resizing, setResizing] = useState(false);

  const handleResizeY = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = imgRef.current?.offsetHeight || 200;
    setResizing(true);

    const onMouseMove = (moveEvent) => {
      const diff = moveEvent.clientY - startY;
      const newH = Math.max(80, startH + diff);
      onResize(index, `${newH}px`);
    };

    const onMouseUp = () => {
      setResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [index, onResize]);

  if (!img.src) {
    return (
      <div className="te-grid-cell">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e, index)}
          hidden
        />
        <button
          type="button"
          className="te-grid-placeholder"
          onClick={() => fileRef.current?.click()}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
            <path d="M21 15l-5-5L5 21" strokeLinecap="round" />
          </svg>
          <span>Click to add image</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`te-grid-cell ${resizing ? 'resizing' : ''}`}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e, index)}
        hidden
      />
      <div className="te-grid-img-wrap">
        <img
          ref={imgRef}
          src={img.src}
          alt={img.alt || ''}
          draggable={false}
          style={{
            height: img.height || 'auto',
            objectFit: img.height ? 'cover' : 'contain',
          }}
        />

        {/* Bottom resize handle */}
        <div
          className="te-grid-resize-handle"
          onMouseDown={handleResizeY}
          title="Drag to resize height"
        >
          <span className="te-grid-resize-bar" />
        </div>

        {/* Replace image button */}
        <button
          type="button"
          className="te-grid-replace"
          onClick={() => fileRef.current?.click()}
          title="Replace image"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </button>

        {/* Remove button */}
        <button
          type="button"
          className="te-grid-remove"
          onClick={() => onRemove(index)}
          title="Remove image"
        >
          &times;
        </button>

        {/* Caption */}
        <input
          type="text"
          className="te-grid-caption"
          value={img.caption || ''}
          onChange={(e) => onCaption(index, e.target.value)}
          placeholder="Caption..."
        />
      </div>
    </div>
  );
};

const GridNodeView = ({ node, updateAttributes, selected, deleteNode }) => {
  const { columns, images } = node.attrs;

  const handleFile = useCallback((e, index) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

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

        const updated = [...images];
        updated[index] = { ...updated[index], src: url, height: '' };
        updateAttributes({ images: updated });
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [images, updateAttributes]);

  const handleCaptionChange = useCallback((index, caption) => {
    const updated = [...images];
    updated[index] = { ...updated[index], caption };
    updateAttributes({ images: updated });
  }, [images, updateAttributes]);

  const removeImage = useCallback((index) => {
    const remaining = images.filter((_, i) => i !== index);
    const filledCount = remaining.filter(img => img.src).length;

    if (filledCount === 0) {
      // All images removed — delete the entire grid node
      deleteNode();
    } else if (remaining.length <= 1) {
      // Down to 1 column — delete grid, it's not needed
      deleteNode();
    } else {
      // Collapse: e.g. 3-col → 2-col
      updateAttributes({ columns: remaining.length, images: remaining });
    }
  }, [images, updateAttributes, deleteNode]);

  const handleResize = useCallback((index, height) => {
    const updated = [...images];
    updated[index] = { ...updated[index], height };
    updateAttributes({ images: updated });
  }, [images, updateAttributes]);

  return (
    <NodeViewWrapper className={`te-image-grid cols-${columns} ${selected ? 'selected' : ''}`}>
      <div className="te-grid-row">
        {images.slice(0, columns).map((img, i) => (
          <GridCell
            key={i}
            img={img}
            index={i}
            onFile={handleFile}
            onCaption={handleCaptionChange}
            onRemove={removeImage}
            onResize={handleResize}
          />
        ))}
      </div>
    </NodeViewWrapper>
  );
};

const ImageGrid = Node.create({
  name: 'imageGrid',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      columns: { default: 2 },
      images: {
        default: [
          { src: '', alt: '', caption: '', height: '' },
          { src: '', alt: '', caption: '', height: '' },
        ],
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute('data-images') || '[]');
          } catch {
            return [];
          }
        },
        renderHTML: (attrs) => ({ 'data-images': JSON.stringify(attrs.images) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-grid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'image-grid', ...HTMLAttributes }, 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GridNodeView);
  },

  addCommands() {
    return {
      insertImageGrid: (columns) => ({ chain }) => {
        const images = Array.from({ length: columns }, () => ({
          src: '',
          alt: '',
          caption: '',
          height: '',
        }));
        return chain().insertContent({ type: this.name, attrs: { columns, images } }).run();
      },
    };
  },
});

export default ImageGrid;

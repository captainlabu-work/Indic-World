import { Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { useCallback, useRef } from 'react';

const GridNodeView = ({ node, updateAttributes, selected }) => {
  const { columns, images } = node.attrs;
  const fileRefs = useRef([]);

  const handleUpload = useCallback((index) => {
    fileRefs.current[index]?.click();
  }, []);

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
        updated[index] = { ...updated[index], src: url };
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
    const updated = [...images];
    updated[index] = { src: '', alt: '', caption: '' };
    updateAttributes({ images: updated });
  }, [images, updateAttributes]);

  return (
    <NodeViewWrapper className={`te-image-grid cols-${columns} ${selected ? 'selected' : ''}`}>
      <div className="te-grid-row">
        {images.slice(0, columns).map((img, i) => (
          <div className="te-grid-cell" key={i}>
            <input
              ref={(el) => { fileRefs.current[i] = el; }}
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e, i)}
              hidden
            />
            {img.src ? (
              <div className="te-grid-img-wrap">
                <img src={img.src} alt={img.alt || ''} draggable={false} />
                <button
                  type="button"
                  className="te-grid-remove"
                  onClick={() => removeImage(i)}
                  title="Remove image"
                >
                  &times;
                </button>
                <input
                  type="text"
                  className="te-grid-caption"
                  value={img.caption || ''}
                  onChange={(e) => handleCaptionChange(i, e.target.value)}
                  placeholder="Caption..."
                />
              </div>
            ) : (
              <button
                type="button"
                className="te-grid-placeholder"
                onClick={() => handleUpload(i)}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
                  <path d="M21 15l-5-5L5 21" strokeLinecap="round" />
                </svg>
                <span>Click to add image</span>
              </button>
            )}
          </div>
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
          { src: '', alt: '', caption: '' },
          { src: '', alt: '', caption: '' },
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
        }));
        return chain().insertContent({ type: this.name, attrs: { columns, images } }).run();
      },
    };
  },
});

export default ImageGrid;

import { useState, useRef, useEffect } from 'react';
import { parseMarkdownToHtml } from '../utils/formatters';
import './RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (showPreview) {
      const html = parseMarkdownToHtml(value);
      setPreviewHtml(html);
    }
  }, [value, showPreview]);

  const insertFormatting = (before, after = '') => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

    onChange({ target: { name: 'content', value: newText } });

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + (after ? 0 : 0);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatBold = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    // Check if text is already bold
    if (start >= 2 && end <= value.length - 2 &&
        value.substring(start - 2, start) === '**' &&
        value.substring(end, end + 2) === '**') {
      // Remove bold
      const newText = value.substring(0, start - 2) + selectedText + value.substring(end + 2);
      onChange({ target: { name: 'content', value: newText } });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start - 2, end - 2);
      }, 0);
    } else {
      insertFormatting('**', '**');
    }
  };

  const formatItalic = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    // Check if text is already italic
    if (start >= 1 && end <= value.length - 1 &&
        value.substring(start - 1, start) === '*' &&
        value.substring(end, end + 1) === '*' &&
        value.substring(start - 2, start) !== '**') {
      // Remove italic
      const newText = value.substring(0, start - 1) + selectedText + value.substring(end + 1);
      onChange({ target: { name: 'content', value: newText } });
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start - 1, end - 1);
      }, 0);
    } else {
      insertFormatting('*', '*');
    }
  };

  const formatHeading = (level) => {
    const hashes = '#'.repeat(level);
    insertFormatting(`${hashes} `, '\n');
  };

  const formatList = () => insertFormatting('- ', '\n');
  const formatNumberedList = () => insertFormatting('1. ', '\n');
  const formatQuote = () => insertFormatting('> ', '\n');
  const formatLink = () => insertFormatting('[', '](url)');
  const formatCode = () => insertFormatting('`', '`');

  return (
    <div className="rich-text-editor">
      <div className="formatting-toolbar">
        <div className="toolbar-group">
          <button type="button" onClick={formatBold} className="toolbar-btn" title="Bold (Ctrl+B)">
            <strong>B</strong>
          </button>
          <button type="button" onClick={formatItalic} className="toolbar-btn" title="Italic (Ctrl+I)">
            <em>I</em>
          </button>
          <button type="button" onClick={() => formatHeading(1)} className="toolbar-btn" title="Heading 1">
            H1
          </button>
          <button type="button" onClick={() => formatHeading(2)} className="toolbar-btn" title="Heading 2">
            H2
          </button>
          <button type="button" onClick={() => formatHeading(3)} className="toolbar-btn" title="Heading 3">
            H3
          </button>
        </div>
        <div className="toolbar-divider"></div>
        <div className="toolbar-group">
          <button type="button" onClick={formatList} className="toolbar-btn" title="Bullet List">
            • List
          </button>
          <button type="button" onClick={formatNumberedList} className="toolbar-btn" title="Numbered List">
            1. List
          </button>
          <button type="button" onClick={formatQuote} className="toolbar-btn" title="Quote">
            " Quote
          </button>
        </div>
        <div className="toolbar-divider"></div>
        <div className="toolbar-group">
          <button type="button" onClick={formatLink} className="toolbar-btn" title="Link">
            🔗 Link
          </button>
          <button type="button" onClick={formatCode} className="toolbar-btn" title="Code">
            {'<>'} Code
          </button>
        </div>
        <div className="toolbar-spacer"></div>
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`toolbar-btn preview-toggle ${showPreview ? 'active' : ''}`}
            title="Toggle Preview"
          >
            {showPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        </div>
      </div>

      <div className="editor-container">
        {!showPreview ? (
          <textarea
            ref={textareaRef}
            name="content"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="editor-textarea"
            rows={15}
            onKeyDown={(e) => {
              // Add keyboard shortcuts
              if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                  case 'b':
                    e.preventDefault();
                    formatBold();
                    break;
                  case 'i':
                    e.preventDefault();
                    formatItalic();
                    break;
                  case 'k':
                    e.preventDefault();
                    formatLink();
                    break;
                }
              }
            }}
          />
        ) : (
          <div className="editor-preview">
            {value ? (
              <div
                className="preview-content"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <div className="preview-empty">Nothing to preview yet. Start writing!</div>
            )}
          </div>
        )}
      </div>

      <div className="editor-footer">
        <div className="editor-hints">
          <span>Shortcuts: <kbd>Ctrl+B</kbd> Bold • <kbd>Ctrl+I</kbd> Italic • <kbd>Ctrl+K</kbd> Link</span>
        </div>
        <div className="char-count">{value.length} characters</div>
      </div>
    </div>
  );
};

export default RichTextEditor;
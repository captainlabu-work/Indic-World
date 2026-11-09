import DOMPurify from 'dompurify';

// Story HTML is produced by the Tiptap editor but stored in Firestore, so it must be
// treated as untrusted before it is rendered. DOMPurify removes scripts, event
// handlers (onerror=...), iframes, forms and javascript: links. On top of that we keep
// only the classes and inline styles the editor itself produces, so stored HTML can't
// borrow site styles to overlay fake UI on a story.

// Classes added by ResizableImage / ImageGrid renderHTML (styled in Article.css),
// plus Tiptap's code block language class.
const ALLOWED_CLASS = /^(article-image|img-(full|large|half)|layout-(left|center|right)|image-grid|cols-[23]|grid-cell|image-frame|language-[\w-]+)$/;

// Inline styles the editor writes: TextAlign and the image grid frame ratio.
function isAllowedStyle(declaration) {
  const [property, ...rest] = declaration.split(':');
  const name = property.trim().toLowerCase();
  const value = rest.join(':').trim().toLowerCase();
  if (name === 'text-align') return ['left', 'center', 'right', 'justify'].includes(value);
  if (name === '--frame-ratio') return /^\d+(\.\d+)?$/.test(value);
  return false;
}

// Filter a class or style attribute. Values are left untouched when everything in
// them is allowed, so editor output renders exactly as before.
DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  let parts;
  let kept;
  let separator;
  if (data.attrName === 'class') {
    parts = data.attrValue.split(/\s+/).filter(Boolean);
    kept = parts.filter((c) => ALLOWED_CLASS.test(c));
    separator = ' ';
  } else if (data.attrName === 'style') {
    parts = data.attrValue.split(';').map((d) => d.trim()).filter(Boolean);
    kept = parts.filter(isAllowedStyle);
    separator = '; ';
  } else {
    return;
  }
  if (kept.length === 0) data.keepAttr = false;
  else if (kept.length < parts.length) data.attrValue = kept.join(separator);
});

// Links in stories always open in a new tab without access to this page.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer nofollow');
  }
});

const CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'option'],
  FORBID_ATTR: ['id', 'name'],
};

export function sanitizeStoryHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, CONFIG);
}

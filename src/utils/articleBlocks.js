import { sanitizeStoryHtml } from './sanitizeHtml';

// Media node tags/selectors — these get media-container treatment
const MEDIA_TAGS = new Set(['FIGURE', 'IMG']);
const isMediaNode = (el) => {
  if (MEDIA_TAGS.has(el.tagName)) return true;
  if (el.tagName === 'DIV' && el.getAttribute('data-type') === 'image-grid') return true;
  return false;
};

// Escape a bare text node so it is re-inserted as text, never as markup
const escapeText = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Split flat story HTML into alternating text-container / media-container blocks.
// The HTML is untrusted: it is sanitized before splitting, and each block is
// sanitized again because it is rendered with dangerouslySetInnerHTML.
export function buildArticleBlocks(htmlString) {
  if (!htmlString) return [];

  const parser = new DOMParser();
  const dom = parser.parseFromString(sanitizeStoryHtml(htmlString), 'text/html');
  const children = Array.from(dom.body.childNodes);

  // Decode images off the main thread, and only download images after the first
  // one when the reader scrolls near them.
  dom.body.querySelectorAll('img').forEach((img, i) => {
    img.setAttribute('decoding', 'async');
    if (i > 0) img.setAttribute('loading', 'lazy');
  });

  const blocks = [];
  let textBuffer = '';

  const flushText = () => {
    if (textBuffer.trim()) {
      blocks.push({ type: 'text', html: sanitizeStoryHtml(textBuffer) });
    }
    textBuffer = '';
  };

  for (const node of children) {
    if (node.nodeType === Node.ELEMENT_NODE && isMediaNode(node)) {
      flushText();
      blocks.push({ type: 'media', html: sanitizeStoryHtml(node.outerHTML) });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      textBuffer += node.outerHTML;
    } else if (node.nodeType === Node.TEXT_NODE) {
      textBuffer += escapeText(node.textContent);
    }
  }
  flushText();

  return blocks;
}

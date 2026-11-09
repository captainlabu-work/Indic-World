// @vitest-environment jsdom
// Story HTML sanitizer tests: real editor output must survive unchanged; attacks must not.
import { describe, expect, it } from 'vitest';
import { getSchema } from '@tiptap/core';
import { DOMSerializer, Node as PMNode } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import ResizableImage from '../../src/components/ResizableImage.jsx';
import ImageGrid from '../../src/components/ImageGrid.jsx';
import { sanitizeStoryHtml } from '../../src/utils/sanitizeHtml.js';
import { buildArticleBlocks } from '../../src/utils/articleBlocks.js';

// Same extensions as TiptapEditor.jsx
const schema = getSchema([
  StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
  ResizableImage,
  ImageGrid,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Underline,
]);

// Serialize a document the same way editor.getHTML() does
function editorHtml(json) {
  const node = PMNode.fromJSON(schema, json);
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(node.content, { document });
  const container = document.createElement('div');
  container.appendChild(fragment);
  return container.innerHTML;
}

const text = (t, marks) => ({ type: 'text', text: t, ...(marks ? { marks } : {}) });
const p = (...content) => ({ type: 'paragraph', content });

const storyDoc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [text('A heading')] },
    { type: 'heading', attrs: { level: 3, textAlign: 'center' }, content: [text('Centered subheading')] },
    p(
      text('Bold', [{ type: 'bold' }]), text(' '),
      text('italic', [{ type: 'italic' }]), text(' '),
      text('underline', [{ type: 'underline' }]), text(' '),
      text('strike', [{ type: 'strike' }]), text(' '),
      text('code', [{ type: 'code' }]), text(' '),
      text('a link', [{ type: 'link', attrs: { href: 'https://example.com/page' } }]),
    ),
    { type: 'paragraph', attrs: { textAlign: 'right' }, content: [text('Right aligned'), { type: 'hardBreak' }, text('next line')] },
    { type: 'blockquote', content: [p(text('A quote'))] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [p(text('one'))] }] },
    { type: 'orderedList', content: [{ type: 'listItem', content: [p(text('two'))] }] },
    { type: 'horizontalRule' },
    { type: 'codeBlock', content: [text('const x = 1;')] },
    { type: 'resizableImage', attrs: { src: 'https://media.indic.world/content/1.jpg', alt: 'Alt', width: '75%', layout: 'center', caption: 'A caption' } },
    { type: 'resizableImage', attrs: { src: 'https://media.indic.world/content/2.jpg', width: '50%', layout: 'left' } },
    {
      type: 'imageGrid',
      attrs: {
        columns: 2,
        images: [
          { src: 'https://media.indic.world/content/a.jpg', alt: '', caption: 'Left', height: '', frameRatio: 1.333 },
          { src: 'https://media.indic.world/content/b.jpg', alt: '', caption: 'Right', height: '' },
        ],
      },
    },
    {
      type: 'imageGrid',
      attrs: {
        columns: 3,
        images: [
          { src: 'https://media.indic.world/content/c.jpg', alt: '', caption: '', height: '' },
          { src: 'https://media.indic.world/content/d.jpg', alt: '', caption: '', height: '' },
          { src: 'https://media.indic.world/content/e.jpg', alt: '', caption: '', height: '' },
        ],
      },
    },
  ],
};

function parse(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

describe('sanitizeStoryHtml keeps everything the editor produces', () => {
  const original = editorHtml(storyDoc);

  it('produces the full range of editor markup (sanity check)', () => {
    for (const needle of ['<h2', 'text-align: center', '<strong>', '<em>', '<u>', '<s>', '<code>',
      'href="https://example.com/page"', '<blockquote>', '<ul>', '<ol>', '<hr>', '<br>', '<pre>',
      'class="article-image img-large layout-center"', '<figcaption>A caption</figcaption>',
      'data-type="image-grid"', 'class="image-grid cols-2"', '--frame-ratio: 1.333', 'cols-3']) {
      expect(original).toContain(needle);
    }
  });

  it('returns markup identical to the editor output', () => {
    const sanitized = sanitizeStoryHtml(original);
    expect(parse(sanitized).isEqualNode(parse(original))).toBe(true);
  });

  it('splits into the same text and image blocks without losing content', () => {
    const blocks = buildArticleBlocks(original);
    expect(blocks.map((b) => b.type)).toEqual(['text', 'media', 'media', 'media', 'media']);
    // Ignore the loading/decoding attributes added for performance (tested below)
    const rendered = parse(blocks.map((b) => b.html).join(''));
    rendered.querySelectorAll('img').forEach((img) => { img.removeAttribute('loading'); img.removeAttribute('decoding'); });
    expect(rendered.isEqualNode(parse(original))).toBe(true);
  });

  it('lazy-loads every story image except the first, and decodes them asynchronously', () => {
    const imgs = [...parse(buildArticleBlocks(original).map((b) => b.html).join('')).querySelectorAll('img')];
    expect(imgs.length).toBe(7);
    expect(imgs[0].hasAttribute('loading')).toBe(false);
    expect(imgs.slice(1).every((img) => img.getAttribute('loading') === 'lazy')).toBe(true);
    expect(imgs.every((img) => img.getAttribute('decoding') === 'async')).toBe(true);
  });

  it('makes links open safely in a new tab', () => {
    const link = parse(sanitizeStoryHtml('<p><a href="https://example.com">x</a></p>')).querySelector('a');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });
});

describe('sanitizeStoryHtml removes hidden code', () => {
  const attacks = {
    'script tag': '<p>hi</p><script>alert(1)</script>',
    'image onerror': '<img src="x" onerror="alert(1)">',
    'javascript: link': '<a href="javascript:alert(1)">click</a>',
    'iframe': '<iframe src="https://evil.example"></iframe>',
    'svg script': '<svg><script>alert(1)</script></svg>',
    'svg onload': '<svg onload="alert(1)"></svg>',
    'form/phishing input': '<form action="https://evil.example"><input name="password"></form>',
    'style tag': '<style>body{display:none}</style><p>x</p>',
    'event handler on paragraph': '<p onclick="alert(1)" onmouseover="alert(1)">x</p>',
    'meta refresh': '<meta http-equiv="refresh" content="0;url=https://evil.example">',
    'object/embed': '<object data="evil.swf"></object><embed src="evil.swf">',
  };

  for (const [name, payload] of Object.entries(attacks)) {
    it(`strips: ${name}`, () => {
      const out = sanitizeStoryHtml(payload).toLowerCase();
      expect(out).not.toMatch(/<script|onerror|onload|onclick|onmouseover|javascript:|<iframe|<svg|<form|<input|<style|<meta|<object|<embed/);
    });
  }

  it('drops inline styles and site classes that could overlay fake UI', () => {
    const out = sanitizeStoryHtml(
      '<p style="position:fixed;inset:0;z-index:9999;text-align:center" class="admin-modal-overlay article-image">x</p>'
    );
    const el = parse(out).querySelector('p');
    expect(el.getAttribute('style')).toBe('text-align:center');
    expect(el.getAttribute('class')).toBe('article-image');
  });

  it('removes id attributes (DOM clobbering)', () => {
    expect(sanitizeStoryHtml('<p id="currentUser">x</p>')).toBe('<p>x</p>');
  });

  it('does not turn escaped text back into markup when splitting blocks', () => {
    const blocks = buildArticleBlocks('&lt;img src=x onerror=alert(1)&gt;<p>after</p>');
    const html = blocks.map((b) => b.html).join('');
    expect(parse(html).querySelector('img')).toBeNull();
    expect(html).toContain('&lt;img');
  });
});

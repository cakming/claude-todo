import { describe, test, expect } from 'vitest';
import { renderMarkdown } from './markdown.js';

describe('renderMarkdown', () => {
  test('renders basic markdown to HTML', () => {
    const html = renderMarkdown('# Title\n\n**bold** and *italic*');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  test('renders images and links', () => {
    const html = renderMarkdown('![alt](/api/p/uploads/1) [x](https://e.com)');
    expect(html).toContain('<img');
    expect(html).toContain('src="/api/p/uploads/1"');
    expect(html).toContain('href="https://e.com"');
  });

  test('strips script tags and event handlers (XSS-safe)', () => {
    const html = renderMarkdown('<script>alert(1)</script><img src=x onerror="alert(1)">');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
  });

  test('handles empty/undefined input', () => {
    expect(renderMarkdown('')).toBe('');
    expect(renderMarkdown(undefined)).toBe('');
  });
});

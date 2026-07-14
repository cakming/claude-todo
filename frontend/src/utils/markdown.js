import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Render user markdown to sanitized HTML for the docs preview. Sanitizing is
// essential: page bodies are free-form user input rendered with innerHTML.
marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(md) {
  const html = marked.parse(md || '', { async: false });
  return DOMPurify.sanitize(html);
}

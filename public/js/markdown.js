import TurndownService from 'turndown';
import { marked } from 'marked';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

function sanitizeHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/href=(?:"|')\s*javascript\s*:/gi, "href=''");
}

export function htmlToMarkdown(html) {
  return turndownService.turndown(html.replace(/<p><\/p>/g, '<p>\u200B</p>'));
}

export function markdownToHtml(md) {
  return sanitizeHtml(marked.parse(md)).replace(/<p>\u200B<\/p>/g, '<p></p>');
}

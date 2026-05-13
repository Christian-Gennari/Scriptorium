import TurndownService from 'turndown';
import { marked } from 'marked';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

export function htmlToMarkdown(html) {
  return turndownService.turndown(html);
}

export function markdownToHtml(md) {
  return marked.parse(md);
}

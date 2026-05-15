import { state, tiptapEditor } from './state.js';

let tocOpen = false;

export function getHeadings() {
  if (!tiptapEditor) return [];
  const headings = [];
  tiptapEditor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        level: node.attrs.level,
        text: node.textContent || 'Untitled',
        pos,
      });
    }
  });
  return headings;
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

export function updateTocTrigger() {
  const trigger = document.getElementById('toc-trigger');
  if (!trigger) return;
  const headings = getHeadings();
  trigger.classList.toggle('hidden', !state.settings.showTableOfContents || headings.length === 0);
}

export function updateToc() {
  const list = document.getElementById('toc-list');
  if (!list) return;
  const headings = getHeadings();
  if (headings.length === 0) {
    list.innerHTML = '';
    updateTocTrigger();
    return;
  }
  list.innerHTML = headings.map(h =>
    `<div class="toc-item toc-level-${h.level}" data-pos="${h.pos}">${escapeHtml(h.text)}</div>`
  ).join('');
  updateTocTrigger();
}

export function openToc() {
  const panel = document.getElementById('toc-panel');
  if (!panel) return;
  panel.classList.add('open');
  tocOpen = true;
}

export function closeToc() {
  const panel = document.getElementById('toc-panel');
  if (!panel) return;
  const wasOpen = tocOpen;
  panel.classList.remove('open');
  tocOpen = false;
  return wasOpen;
}

function toggleToc() {
  if (tocOpen) closeToc();
  else openToc();
}

export function initToc() {
  document.getElementById('toc-list')?.addEventListener('click', (e) => {
    const item = e.target.closest('.toc-item');
    if (!item) return;
    const pos = parseInt(item.dataset.pos, 10);
    if (isNaN(pos)) return;
    const editor = tiptapEditor;
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos).run();

    requestAnimationFrame(() => {
      const dom = editor.view.nodeDOM(pos);
      if (dom) {
        const heading = dom.nodeType === Node.ELEMENT_NODE
          ? dom.closest('h1,h2,h3,h4,h5,h6') || dom
          : dom.parentElement?.closest('h1,h2,h3,h4,h5,h6') || dom.parentElement;
        heading?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      closeToc();
    });
  });

  document.getElementById('toc-trigger')?.addEventListener('click', toggleToc);
  document.getElementById('btn-close-toc')?.addEventListener('click', closeToc);

  document.addEventListener('click', (e) => {
    if (!tocOpen) return;
    const panel = document.getElementById('toc-panel');
    const trigger = document.getElementById('toc-trigger');
    if (panel?.contains(e.target) || trigger?.contains(e.target)) return;
    closeToc();
  });

  updateToc();
}

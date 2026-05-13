import { state, editorEl, setTiptapEditor } from './state.js';
import { updateStats } from './ui.js';
import { triggerAutoSave } from './files.js';
import { playTypewriterSound } from './audio.js';
import { markdownToHtml } from './markdown.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import BubbleMenu from '@tiptap/extension-bubble-menu';

const COMMAND_MAP = {
  bold: (chain) => chain.toggleBold(),
  italic: (chain) => chain.toggleItalic(),
  h1: (chain) => chain.toggleHeading({ level: 1 }),
  h2: (chain) => chain.toggleHeading({ level: 2 }),
  bulletList: (chain) => chain.toggleBulletList(),
  orderedList: (chain) => chain.toggleOrderedList(),
  blockquote: (chain) => chain.toggleBlockquote(),
  undo: (chain) => chain.undo(),
  redo: (chain) => chain.redo(),
};

const ACTIVE_CHECKS = {
  bold: (editor) => editor.isActive('bold'),
  italic: (editor) => editor.isActive('italic'),
  h1: (editor) => editor.isActive('heading', { level: 1 }),
  h2: (editor) => editor.isActive('heading', { level: 2 }),
  bulletList: (editor) => editor.isActive('bulletList'),
  orderedList: (editor) => editor.isActive('orderedList'),
  blockquote: (editor) => editor.isActive('blockquote'),
};

export function initEditor(markdownContent = '') {
  const editor = new Editor({
    element: editorEl,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Typography,
      BubbleMenu.configure({
        element: document.querySelector('#bubble-menu'),
      }),
    ],
    content: markdownContent ? markdownToHtml(markdownContent) : '',
    onUpdate: () => {
      const suppressed = state._suppressDirty;
      if (!suppressed) {
        state.isDirty = true;
        triggerAutoSave();
      }
      updateStats();
    },
    editorProps: {
      attributes: {
        spellcheck: String(state.settings.spellCheck ?? false),
      },
    },
  });

  const bubbleMenuEl = document.querySelector('#bubble-menu');

  bubbleMenuEl.querySelectorAll('[data-command]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.command;
      const fn = COMMAND_MAP[cmd];
      if (fn) {
        fn(editor.chain().focus()).run();
      }
    });
  });

  editor.on('selectionUpdate', () => {
    bubbleMenuEl.querySelectorAll('[data-command]').forEach((btn) => {
      const cmd = btn.dataset.command;
      const check = ACTIVE_CHECKS[cmd];
      if (check) {
        btn.classList.toggle('is-active', check(editor));
      }
    });
  });

  const pmEl = editorEl.querySelector('.ProseMirror');
  if (pmEl) {
    pmEl.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === 'Enter') {
          playTypewriterSound('enter');
        } else if (e.key === 'Backspace') {
          playTypewriterSound('backspace');
        } else if (e.key === ' ') {
          playTypewriterSound('space');
        } else if (e.key.length === 1) {
          playTypewriterSound('keypress');
        }
      }
    });
  }

  setTiptapEditor(editor);
  return editor;
}

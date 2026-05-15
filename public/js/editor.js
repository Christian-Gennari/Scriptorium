import { state, editorEl, setTiptapEditor } from './state.js';
import { updateStats } from './ui.js';
import { updateToc } from './toc.js';
import { triggerAutoSave } from './files.js';
import { playTypewriterSound } from './audio.js';
import { markdownToHtml } from './markdown.js';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import BubbleMenu from '@tiptap/extension-bubble-menu';

const isMobile = window.matchMedia('(pointer: coarse)').matches;

const COMMAND_MAP = {
  bold: (chain) => chain.toggleBold(),
  italic: (chain) => chain.toggleItalic(),
  h1: (chain) => chain.toggleHeading({ level: 1 }),
  h2: (chain) => chain.toggleHeading({ level: 2 }),
  h3: (chain) => chain.toggleHeading({ level: 3 }),
  bulletList: (chain) => chain.toggleBulletList(),
  orderedList: (chain) => chain.toggleOrderedList(),
  blockquote: (chain) => chain.toggleBlockquote(),
};

const ACTIVE_CHECKS = {
  bold: (editor) => editor.isActive('bold'),
  italic: (editor) => editor.isActive('italic'),
  h1: (editor) => editor.isActive('heading', { level: 1 }),
  h2: (editor) => editor.isActive('heading', { level: 2 }),
  h3: (editor) => editor.isActive('heading', { level: 3 }),
  bulletList: (editor) => editor.isActive('bulletList'),
  orderedList: (editor) => editor.isActive('orderedList'),
  blockquote: (editor) => editor.isActive('blockquote'),
};

export function initEditor(markdownContent = '') {
  const extensions = [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Start writing...',
    }),
    Typography,
  ];

  if (!isMobile) {
    extensions.push(BubbleMenu.configure({
      element: document.querySelector('#bubble-menu'),
    }));
  }

  const editor = new Editor({
    element: editorEl,
    extensions,
    content: markdownContent ? markdownToHtml(markdownContent) : '',
    onUpdate: () => {
      const suppressed = state._suppressDirty;
      if (!suppressed) {
        state.isDirty = true;
        triggerAutoSave();
      }
      updateStats();
      updateToc();
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key === 'Tab') {
          if (editor.isActive('bulletList') || editor.isActive('orderedList')) {
            return false;
          }
          event.preventDefault();
          return true;
        }
        return false;
      },
      attributes: {
        spellcheck: String(state.settings.spellCheck ?? false),
      },
    },
  });

  if (!isMobile) {
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
  } else {
    setupMobileBubbleMenu(editor);
  }

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
          playTypewriterSound('keypress', e.keyCode);
        }
      }
    });
  }

  setTiptapEditor(editor);
  updateToc();
  return editor;
}

function setupMobileBubbleMenu(editor) {
  const bar = document.getElementById('bubble-menu-mobile');

  bar.querySelectorAll('[data-command]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.dataset.command;
      const fn = COMMAND_MAP[cmd];
      if (fn) {
        fn(editor.chain().focus()).run();
      }
    });
  });

  editor.on('selectionUpdate', () => {
    if (!editor.isFocused) return;
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;

    bar.classList.toggle('shown', hasSelection);

    if (hasSelection) {
      bar.querySelectorAll('[data-command]').forEach((btn) => {
        const cmd = btn.dataset.command;
        const check = ACTIVE_CHECKS[cmd];
        if (check) {
          btn.classList.toggle('is-active', check(editor));
        }
      });
    }
  });

  editor.on('blur', () => {
    setTimeout(() => {
      if (!editor.isFocused) {
        bar.classList.remove('shown');
      }
    }, 150);
  });

  let keyboardTimer;
  let prevViewportHeight = window.visualViewport?.height ?? window.innerHeight;

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const currHeight = window.visualViewport.height;
      const keyboardOpen = currHeight < prevViewportHeight - 100;
      clearTimeout(keyboardTimer);
      if (keyboardOpen) {
        bar.classList.remove('shown');
      } else {
        keyboardTimer = setTimeout(() => {
          const { from, to } = editor.state.selection;
          bar.classList.toggle('shown', from !== to && editor.isFocused);
        }, 100);
      }
      prevViewportHeight = currHeight;
    });
  }
}

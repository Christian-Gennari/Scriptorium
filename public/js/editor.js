import { state, editor } from './state.js';
import { updateStats } from './ui.js';
import { triggerAutoSave } from './files.js';
import { playTypewriterSound } from './audio.js';

export function applySmartQuotes(textarea) {
  const pos = textarea.selectionStart;
  const val = textarea.value;
  if (pos < 1) return false;

  const prevChar = val[pos - 1];

  if (state.settings.smartQuotes) {
    if (prevChar === '"') {
      const beforePrev = pos >= 2 ? val[pos - 2] : ' ';
      const isOpen = /[\s({[]/.test(beforePrev) || pos === 1;
      const replacement = isOpen ? '\u201C' : '\u201D';
      textarea.setRangeText(replacement, pos - 1, pos, 'end');
      return true;
    }
    if (prevChar === "'") {
      const beforePrev = pos >= 2 ? val[pos - 2] : ' ';
      const isOpen = /[\s({[]/.test(beforePrev) || pos === 1;
      const replacement = isOpen ? '\u2018' : '\u2019';
      textarea.setRangeText(replacement, pos - 1, pos, 'end');
      return true;
    }
  }

  if (state.settings.smartDashes) {
    if (pos >= 2 && val[pos - 2] === '-' && val[pos - 1] === '-') {
      textarea.setRangeText('\u2014', pos - 2, pos, 'end');
      return true;
    }
  }

  return false;
}

editor.addEventListener('input', () => {
  applySmartQuotes(editor);
  updateStats();
  triggerAutoSave();
});

editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.setRangeText('  ', start, end, 'end');
  }
  if (e.repeat) return;
  if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Backspace') {
    if (!e.ctrlKey && !e.altKey && !e.metaKey) {
      playTypewriterSound(e.key === 'Enter');
    }
  }
});

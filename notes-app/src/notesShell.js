import { readNotes, writeNotes } from './noteStorage';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderList(container) {
  const list = container.querySelector('#notes-list');
  if (!list) return;
  const notes = readNotes();
  list.innerHTML = notes
    .map(
      (n) =>
        `<li class="li" data-id="${n.id}"><span class="li__text">${escapeHtml(n.text)}</span><button type="button" class="btn btn--small note-del">Удалить</button></li>`
    )
    .join('');
}

/**
 * @param {HTMLElement} container
 * @param {{ onNewNote: (text: string, timestamp: number) => void }} api
 * @returns {() => void}
 */
export function attachNotesHome(container, { onNewNote }) {
  const form = container.querySelector('#note-form');
  const input = container.querySelector('#note-input');
  if (!form || !input) {
    return () => {};
  }

  const onSubmit = (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const timestamp = Date.now();
    const notes = readNotes();
    notes.push({ id: timestamp, text });
    writeNotes(notes);
    input.value = '';
    renderList(container);
    onNewNote(text, timestamp);
  };

  const onClick = (e) => {
    const btn = e.target.closest('.note-del');
    if (!btn) return;
    const li = btn.closest('li');
    const id = li ? Number(li.dataset.id) : NaN;
    if (!Number.isFinite(id)) return;
    writeNotes(readNotes().filter((n) => n.id !== id));
    renderList(container);
  };

  form.addEventListener('submit', onSubmit);
  container.addEventListener('click', onClick);
  renderList(container);

  const refresh = () => renderList(container);
  window.__notesShellRefresh = refresh;

  return () => {
    form.removeEventListener('submit', onSubmit);
    container.removeEventListener('click', onClick);
    if (window.__notesShellRefresh === refresh) {
      delete window.__notesShellRefresh;
    }
  };
}

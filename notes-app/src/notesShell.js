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
    .map((n) => {
      const reminderText =
        typeof n.reminder === 'number' && Number.isFinite(n.reminder)
          ? `<small class="li__meta">Напоминание: ${escapeHtml(
              new Date(n.reminder).toLocaleString()
            )}</small>`
          : '';
      return `<li class="li" data-id="${n.id}"><span class="li__text">${escapeHtml(
        n.text
      )}${reminderText}</span><button type="button" class="btn btn--small note-del">Удалить</button></li>`;
    })
    .join('');
}

/**
 * @param {HTMLElement} container
 * @param {{ onNewNote: (note: { id: number, text: string, reminder: number | null }) => void }} api
 * @returns {() => void}
 */
export function attachNotesHome(container, { onNewNote }) {
  const form = container.querySelector('#note-form');
  const input = container.querySelector('#note-input');
  const reminderForm = container.querySelector('#reminder-form');
  const reminderTextInput = container.querySelector('#reminder-text');
  const reminderTimeInput = container.querySelector('#reminder-time');
  if (
    !form ||
    !input ||
    !reminderForm ||
    !reminderTextInput ||
    !reminderTimeInput
  ) {
    return () => {};
  }

  const addNote = (text, reminder = null) => {
    const id = Date.now();
    const notes = readNotes();
    const note = { id, text, reminder };
    notes.push(note);
    writeNotes(notes);
    renderList(container);
    onNewNote(note);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addNote(text, null);
    input.value = '';
  };

  const onReminderSubmit = (e) => {
    e.preventDefault();
    const text = reminderTextInput.value.trim();
    const reminderValue = reminderTimeInput.value;
    if (!text || !reminderValue) return;
    const reminder = new Date(reminderValue).getTime();
    if (!Number.isFinite(reminder) || reminder <= Date.now()) {
      window.alert('Дата напоминания должна быть в будущем.');
      return;
    }
    addNote(text, reminder);
    reminderTextInput.value = '';
    reminderTimeInput.value = '';
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
  reminderForm.addEventListener('submit', onReminderSubmit);
  container.addEventListener('click', onClick);
  renderList(container);

  const refresh = () => renderList(container);
  window.__notesShellRefresh = refresh;

  return () => {
    form.removeEventListener('submit', onSubmit);
    reminderForm.removeEventListener('submit', onReminderSubmit);
    container.removeEventListener('click', onClick);
    if (window.__notesShellRefresh === refresh) {
      delete window.__notesShellRefresh;
    }
  };
}

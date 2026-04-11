const NOTES_KEY = 'notes';

export function normalizeNotes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      if (typeof item === 'string') {
        return { id: Date.now() + i, text: item, reminder: null };
      }
      if (item && typeof item.text === 'string') {
        const parsedReminder =
          typeof item.reminder === 'number' && Number.isFinite(item.reminder)
            ? item.reminder
            : null;
        return {
          id: item.id ?? Date.now() + i,
          text: item.text,
          reminder: parsedReminder,
        };
      }
      return null;
    })
    .filter(Boolean);
}

export function readNotes() {
  try {
    return normalizeNotes(JSON.parse(localStorage.getItem(NOTES_KEY) || '[]'));
  } catch {
    return [];
  }
}

export function writeNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

const NOTES_KEY = 'notes';

export function normalizeNotes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      if (typeof item === 'string') {
        return { id: Date.now() + i, text: item };
      }
      if (item && typeof item.text === 'string') {
        return { id: item.id ?? Date.now() + i, text: item.text };
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

import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [notes, setNotes] = useState([]);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('notes') || '[]');
      setNotes(Array.isArray(saved) ? saved : []);
    } catch {
      setNotes([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('notes', JSON.stringify(notes));
    } catch {
    }
  }, [notes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (text) {
      setNotes((prev) => [...prev, text]);
      setInputValue('');
    }
  };

  const handleDelete = (index) => {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Заметки</h1>
      </header>
      <main className="app__main">
        <form className="form" onSubmit={handleSubmit}>
          <label className="form__label" htmlFor="note-input">
            Новая заметка
          </label>
          <div className="form__row">
            <input
              id="note-input"
              className="form__input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Введите заметку"
              required
              autoComplete="off"
            />
            <button className="form__btn" type="submit">
              Добавить
            </button>
          </div>
        </form>
        <section className="list-section" aria-labelledby="list-heading">
          <h2 id="list-heading" className="list-section__title">
            Список заметок
          </h2>
          {notes.length === 0 ? (
            <p className="list-section__empty">Пока нет заметок</p>
          ) : (
            <ul className="list">
              {notes.map((note, index) => (
                <li key={index} className="list__item">
                  <span className="list__text">{note}</span>
                  <button
                    type="button"
                    className="list__del"
                    onClick={() => handleDelete(index)}
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

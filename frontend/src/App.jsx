import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import {
  GET_BOOKS,
  GET_AUTHORS,
  CREATE_AUTHOR,
  CREATE_BOOK,
} from './queries'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('books')
  const [authorName, setAuthorName] = useState('')
  const [bookTitle, setBookTitle] = useState('')
  const [bookYear, setBookYear] = useState('')
  const [bookAuthorId, setBookAuthorId] = useState('')

  const { data: booksData, loading: booksLoading, refetch: refetchBooks } = useQuery(GET_BOOKS)
  const { data: authorsData, loading: authorsLoading, refetch: refetchAuthors } = useQuery(GET_AUTHORS)

  const [createAuthor] = useMutation(CREATE_AUTHOR, {
    onCompleted: () => {
      setAuthorName('')
      refetchAuthors()
      refetchBooks()
    },
  })

  const [createBook] = useMutation(CREATE_BOOK, {
    onCompleted: () => {
      setBookTitle('')
      setBookYear('')
      setBookAuthorId('')
      refetchBooks()
      refetchAuthors()
    },
  })

  const books = booksData?.books ?? []
  const authors = authorsData?.authors ?? []

  function handleCreateAuthor(e) {
    e.preventDefault()
    if (!authorName.trim()) return
    createAuthor({ variables: { name: authorName.trim() } })
  }

  function handleCreateBook(e) {
    e.preventDefault()
    if (!bookTitle.trim() || !bookAuthorId) return
    createBook({
      variables: {
        title: bookTitle.trim(),
        authorId: bookAuthorId,
        year: bookYear ? parseInt(bookYear, 10) : null,
      },
    })
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Каталог книг</h1>
        <p className="subtitle">GraphQL · Apollo Server</p>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={tab === 'books' ? 'tab active' : 'tab'}
          onClick={() => setTab('books')}
        >
          Книги
        </button>
        <button
          type="button"
          className={tab === 'authors' ? 'tab active' : 'tab'}
          onClick={() => setTab('authors')}
        >
          Авторы
        </button>
        <button
          type="button"
          className={tab === 'add' ? 'tab active' : 'tab'}
          onClick={() => setTab('add')}
        >
          Добавить
        </button>
      </nav>

      <main className="main">
        {tab === 'books' && (
          <section className="panel">
            <h2>Книги</h2>
            {booksLoading && <p className="msg">Загрузка...</p>}
            {!booksLoading && books.length === 0 && <p className="msg">Нет книг</p>}
            <ul className="list">
              {books.map((book) => (
                <li key={book.id}>
                  <strong>{book.title}</strong>
                  {book.year && <span className="meta"> ({book.year})</span>}
                  <span className="meta"> — {book.author.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'authors' && (
          <section className="panel">
            <h2>Авторы</h2>
            {authorsLoading && <p className="msg">Загрузка...</p>}
            {!authorsLoading && authors.length === 0 && <p className="msg">Нет авторов</p>}
            <ul className="list">
              {authors.map((author) => (
                <li key={author.id}>
                  <strong>{author.name}</strong>
                  <ul className="sublist">
                    {author.books.map((book) => (
                      <li key={book.title}>{book.title}</li>
                    ))}
                    {author.books.length === 0 && <li className="empty">Нет книг</li>}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tab === 'add' && (
          <section className="panel forms">
            <form className="form" onSubmit={handleCreateAuthor}>
              <h2>Новый автор</h2>
              <label>
                Имя
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </label>
              <button type="submit">Создать автора</button>
            </form>

            <form className="form" onSubmit={handleCreateBook}>
              <h2>Новая книга</h2>
              <label>
                Название
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                />
              </label>
              <label>
                Год
                <input
                  type="number"
                  value={bookYear}
                  onChange={(e) => setBookYear(e.target.value)}
                />
              </label>
              <label>
                Автор
                <select
                  value={bookAuthorId}
                  onChange={(e) => setBookAuthorId(e.target.value)}
                >
                  <option value="">Выберите автора</option>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Создать книгу</button>
            </form>
          </section>
        )}
      </main>

      <footer className="footer">Sandbox: http://localhost:4000</footer>
    </div>
  )
}

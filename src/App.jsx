import { Suspense, lazy } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import './App.css'

const About = lazy(() => import('./pages/About'))

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">Практика 25</h1>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'link active' : 'link')}>
            Главная
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => (isActive ? 'link active' : 'link')}>
            О нас
          </NavLink>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/about"
            element={
              <Suspense fallback={<p className="loading">Загрузка...</p>}>
                <About />
              </Suspense>
            }
          />
        </Routes>
      </main>
      <footer className="footer">Vite · Code splitting · Tree-shaking</footer>
    </div>
  )
}

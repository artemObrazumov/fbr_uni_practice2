import { add } from '../utils/math'

export default function Home() {
  return (
    <section className="page">
      <h2>Главная</h2>
      <p>React-приложение на Vite с оптимизацией бандла.</p>
      <p className="demo">2 + 3 = {add(2, 3)}</p>
    </section>
  )
}

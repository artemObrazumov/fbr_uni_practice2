import { formatDate } from '../utils/date'

const team = [
  { name: 'Анна', role: 'Frontend' },
  { name: 'Игорь', role: 'Backend' },
  { name: 'Мария', role: 'DevOps' },
]

export default function About() {
  return (
    <section className="page">
      <h2>О нас</h2>
      <p>Страница загружается отдельным чанком через React.lazy.</p>
      <p className="demo">Сегодня: {formatDate(new Date())}</p>
      <ul className="team">
        {team.map((person) => (
          <li key={person.name}>
            <strong>{person.name}</strong> — {person.role}
          </li>
        ))}
      </ul>
    </section>
  )
}

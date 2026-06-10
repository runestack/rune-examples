import { useEffect, useState } from 'react'

export default function App() {
  const [notes, setNotes] = useState([])
  const [text, setText] = useState('')
  const [error, setError] = useState(null)

  async function load() {
    try {
      const res = await fetch('/api/notes')
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      setNotes(await res.json())
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (res.ok) {
      setText('')
      load()
    } else {
      setError(`API returned ${res.status}`)
    }
  }

  return (
    <main>
      <h1>Notes</h1>
      <p className="sub">React → nginx → Spring Boot → Postgres, all on Rune.</p>

      <form onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a note…"
          aria-label="Note text"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">Error: {error}</p>}

      <ul>
        {notes.map((n) => (
          <li key={n.id}>
            <span>{n.text}</span>
            <time>{new Date(n.createdAt).toLocaleString()}</time>
          </li>
        ))}
      </ul>
      {!error && notes.length === 0 && <p className="sub">No notes yet — add one above.</p>}
    </main>
  )
}

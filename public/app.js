const form = document.getElementById('form')
const result = document.getElementById('result')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const data = new FormData(form)
  const body = {
    type: data.get('type'),
    payload: {
      to: data.get('email') || 'user@example.com',
      fail: data.get('fail') === 'on',
    },
  }

  result.classList.remove('hidden', 'ok', 'err')

  try {
    const res = await fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || res.statusText)
    result.classList.add('ok')
    result.textContent = `Задача ${json.task.id} отправлена в очередь`
  } catch (err) {
    result.classList.add('err')
    result.textContent = err.message
  }
})

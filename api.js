import express from 'express'
import amqplib from 'amqplib'
import path from 'path'
import { fileURLToPath } from 'url'
import { AMQP_URL, TASK_QUEUE, setupQueues } from './queues.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000

let channel

async function connectRabbit() {
  const connection = await amqplib.connect(AMQP_URL)
  channel = await connection.createChannel()
  await setupQueues(channel)
}

async function publishTask(task) {
  const body = Buffer.from(JSON.stringify(task))
  channel.sendToQueue(TASK_QUEUE, body, { persistent: true, contentType: 'application/json' })
}

const app = express()
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/health', (_, res) => {
  res.json({ ok: true })
})

app.post('/tasks', async (req, res) => {
  const { type, payload } = req.body
  if (!type) {
    res.status(400).json({ error: 'Нужно поле type' })
    return
  }

  const task = {
    id: String(Date.now()),
    type,
    payload: payload ?? {},
    createdAt: new Date().toISOString(),
  }

  try {
    await publishTask(task)
    res.status(201).json({ ok: true, task })
  } catch (err) {
    res.status(503).json({ error: err.message })
  }
})

await connectRabbit()
app.listen(PORT, () => {
  console.log(`API: http://localhost:${PORT}`)
  console.log(`POST /tasks`)
})

import amqplib from 'amqplib'
import { AMQP_URL, TASK_QUEUE, setupQueues } from './queues.js'
import { processWithRetry } from './retry.js'

const WORKER_ID = process.env.WORKER_ID || '1'
const MAX_RETRIES = 3

async function processTask(task) {
  const delay = 800 + Math.random() * 1200
  await new Promise((resolve) => setTimeout(resolve, delay))

  if (task.payload?.fail) {
    throw new Error('Симуляция ошибки обработки')
  }

  console.log(`[Worker ${WORKER_ID}] Готово: ${task.id} (${task.type})`, task.payload)
}

async function startWorker() {
  const connection = await amqplib.connect(AMQP_URL)
  const channel = await connection.createChannel()
  await setupQueues(channel)
  channel.prefetch(1)

  console.log(`[Worker ${WORKER_ID}] Ожидание задач в "${TASK_QUEUE}"...`)

  channel.consume(TASK_QUEUE, async (msg) => {
    if (!msg) return

    const task = JSON.parse(msg.content.toString())
    console.log(`[Worker ${WORKER_ID}] Задача ${task.id}: ${task.type}`)

    try {
      await processWithRetry(task, processTask, { maxRetries: MAX_RETRIES })
      channel.ack(msg)
    } catch (err) {
      console.error(`[Worker ${WORKER_ID}] В DLQ: ${task.id} — ${err.message}`)
      channel.nack(msg, false, false)
    }
  })
}

await startWorker()

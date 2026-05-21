export const TASK_QUEUE = 'task_queue'
export const DLX_EXCHANGE = 'dlx_exchange'
export const DLQ = 'dead_letter_queue'
export const DLQ_ROUTING_KEY = 'dead'
export const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672'

export async function setupQueues(channel) {
  await channel.assertExchange(DLX_EXCHANGE, 'direct', { durable: true })
  await channel.assertQueue(DLQ, { durable: true })
  await channel.bindQueue(DLQ, DLX_EXCHANGE, DLQ_ROUTING_KEY)
  await channel.assertQueue(TASK_QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': DLX_EXCHANGE,
      'x-dead-letter-routing-key': DLQ_ROUTING_KEY,
    },
  })
}

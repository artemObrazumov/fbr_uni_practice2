import amqplib from 'amqplib'
import { AMQP_URL, setupQueues } from './queues.js'

const connection = await amqplib.connect(AMQP_URL)
const channel = await connection.createChannel()
await setupQueues(channel)
console.log('Очереди: task_queue → DLX → dead_letter_queue')
await connection.close()

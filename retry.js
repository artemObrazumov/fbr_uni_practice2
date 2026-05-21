export async function processWithRetry(message, processor, options = {}) {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000 } = options
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      await processor(message)
      return
    } catch (err) {
      attempt++
      if (attempt > maxRetries) {
        throw err
      }
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs) + Math.random() * 500
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

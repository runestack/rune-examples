import express from 'express'
import os from 'node:os'

const app = express()
const port = process.env.PORT ?? 3000

// GREETING comes from a Rune configmap via envFrom (see deploy/app.yaml).
const greeting = process.env.GREETING ?? 'hello from node on rune'

app.get('/api/hello', (req, res) => {
  res.json({ message: greeting, instance: os.hostname() })
})

app.get('/healthz', (req, res) => {
  res.send('ok')
})

app.listen(port, () => {
  console.log(`listening on :${port} (instance ${os.hostname()})`)
})

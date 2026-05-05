import dotenv from 'dotenv'
dotenv.config()

import app from './app'

const PORT = parseInt(process.env.PORT || '3001', 10)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VentureSpan API running on port ${PORT}`)
})
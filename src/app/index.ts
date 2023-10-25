import express, { Express } from 'express'
const app: Express = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
export default app

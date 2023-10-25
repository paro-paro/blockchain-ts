import express, { Express, Response } from 'express'
import Blockchain from './blockchain.js'
import { registerNode, registerNodeAll, registerAndBroadcastNode } from './endpoints/network.js'
import {
  getBlockchain,
  checkBlockchain,
  consentBlockchain,
  addAndBroadcastTransaction,
  mineAndBroadcastBlock,
  receiveTransaction,
  receiveBlock,
} from './endpoints/blockchain.js'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const blockchain = new Blockchain()
const app: Express = express()
const port = process.argv[2]

async function main() {
  console.log('Starting blockchain...')
}

await main()
// middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// api endpoints
app.get('/', (_, res: Response) => res.send('Javascript blockchain API'))
app.get('/explorer', (_, res: Response) => res.sendFile(__dirname + '/../public/explorer.html'))

// network endpoints
app.post('/register-node', registerNode)
app.post('/register-node-all', registerNodeAll)
app.post('/register-broadcast-node', registerAndBroadcastNode)

// blockchain endpoints
app.get('/blockchain', getBlockchain)
app.get('/mine', mineAndBroadcastBlock)
app.post('/transaction', addAndBroadcastTransaction)
app.post('/receive-block', receiveBlock)
app.post('/receive-transaction', receiveTransaction)
app.get('/consent', consentBlockchain)
app.get('/check', checkBlockchain)

// start server
app.listen(port, () => console.log(`API listening on port ${port}`))

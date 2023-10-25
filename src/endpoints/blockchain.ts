import { Request, Response } from 'express'
import { blockchain } from '../server.js'
import { MINE_REWARD, MINT_ADDRESS, NODE_ADDRESS } from '../constants.js'
import { getBroadcastPromises, handleRequestError } from '../utils.js'
import { Block, Transaction, CurrentBlockData, NewBlockProps } from '../types.js'

export const getBlockchain = function (req: Request, res: Response) {
  res.send(blockchain)
}

export const checkBlockchain = function (req: Request, res: Response) {
  const isValid = blockchain.isValidChain(blockchain.chain)
  res.send(isValid ? 'Blockchain is valid' : 'Blockchain is not valid')
}

export const receiveTransaction = function (req: Request, res: Response) {
  const transaction: Transaction = req.body.transaction
  blockchain.addTransactionToPendingTransactions(transaction)
  res.send({
    msg: 'Transaction added successfully',
    transaction,
  })
}

export const receiveBlock = function (req: Request, res: Response) {
  const newBlock: Block = req.body.block
  const lastBlock = blockchain.getLastBlock()
  const correctHash = lastBlock.hash === newBlock.previousBlockHash
  const correctIndex = lastBlock.index + 1 === newBlock.index

  if (correctHash && correctIndex) {
    blockchain.chain.push(newBlock)
    blockchain.pendingTransactions = []
    res.send({
      msg: 'Block added successfully',
      block: newBlock,
    })
  } else {
    res.status(500).send('Error: incorrect previous block hash')
  }
}

export const addAndBroadcastTransaction = async function (req: Request, res: Response) {
  const { amount, sender, recipient } = req.body
  const transaction = blockchain.createNewTransaction(amount, sender, recipient)
  blockchain.addTransactionToPendingTransactions(transaction)
  const promises = getBroadcastPromises(blockchain.networkNodes, '/receive-transaction', { transaction })
  try {
    await Promise.all(promises) // note: missing responses check for ok status!
    res.json({
      msg: 'Transaction added and broadcasted successfully',
      transaction,
    })
  } catch (error) {
    const msg = handleRequestError(error)
    res.status(500).send(msg)
  }
}

export const consentBlockchain = async function (req: Request, res: Response) {
  try {
    const promises = blockchain.networkNodes.map(async (networkNodeURL) => {
      const url = networkNodeURL + '/blockchain'
      const requestOptions = { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      return await fetch(url, requestOptions)
    })
    const responses = await Promise.all(promises) // note: missing responses check for ok status!
    const data = responses.map(async (response) => await response.json())

    const blockchainsFromNodes = (await Promise.all(data)).map((i) => ({
      chain: i.chain,
      pendingTransactions: i.pendingTransactions,
    })) as Array<{ chain: Block[]; pendingTransactions: Transaction[] }>

    // check if one of the chains hosted on any other node of the current network is longer than the chain hosted in the current node
    let maxChainLength = blockchain.chain.length
    let newLongestChain: Block[] | undefined
    let newPendingTransactions: Transaction[] | undefined

    // note: ts cannot infered what happens within callbacks!
    blockchainsFromNodes.forEach((i) => {
      if (i.chain.length > maxChainLength) {
        maxChainLength = i.chain.length
        newLongestChain = i.chain
        newPendingTransactions = i.pendingTransactions
      }
    })

    if (newLongestChain && blockchain.isValidChain(newLongestChain)) {
      blockchain.chain = newLongestChain
      blockchain.pendingTransactions = newPendingTransactions as Transaction[]
      res.json({
        msg: 'Current chain has been replaced',
        chain: blockchain.chain,
      })
    } else {
      res.json({
        msg: 'Current chain has not been replaced',
        chain: blockchain.chain,
      })
    }
  } catch (error) {
    const msg = handleRequestError(error)
    res.status(500).send(msg)
  }
}

export const mineAndBroadcastBlock = async function (req: Request, res: Response) {
  try {
    mineNewBlock()
    const block = blockchain.getLastBlock()
    const promises = getBroadcastPromises(blockchain.networkNodes, '/receive-block', { block })
    await Promise.all(promises) // note: missing responses check for ok status!
    await handleRewardTransaction()
    res.json({
      msg: 'Block mined and broadcasted successfully',
      block,
    })
  } catch (error) {
    const msg = handleRequestError(error)
    res.status(500).send(msg)
  }
}

const mineNewBlock = function (): void {
  const { nonce, hash, previousBlockHash } = getNewBlockProps()
  blockchain.createNewBlock(nonce, hash, previousBlockHash)
}

const getNewBlockProps = function (): NewBlockProps {
  const lastBlock = blockchain.getLastBlock()
  const previousBlockHash = lastBlock.hash

  const currentBlockData: CurrentBlockData = {
    index: lastBlock.index + 1,
    transactions: blockchain.pendingTransactions,
  }

  const nonce = blockchain.getNonceByProofOfWork(previousBlockHash, currentBlockData)
  const hash = blockchain.getBlockHash(nonce, previousBlockHash, currentBlockData)
  return {
    nonce,
    hash,
    previousBlockHash,
  }
}

const handleRewardTransaction = async function (): Promise<void> {
  const transaction = blockchain.createNewTransaction(MINE_REWARD, MINT_ADDRESS, NODE_ADDRESS)
  blockchain.addTransactionToPendingTransactions(transaction)
  const promises = getBroadcastPromises(blockchain.networkNodes, '/receive-transaction', { transaction })
  try {
    await Promise.all(promises) // note: missing responses check for ok status!
  } catch (error) {
    const msg = handleRequestError(error)
    throw new Error(`Error broadcasting reward transaction: ${msg}`)
  }
}

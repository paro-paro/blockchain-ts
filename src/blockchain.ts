import { getUniqueId, getHashSHA256 } from './utils.js'
import { NODE_ADDRESS } from './constants.js'
import { Block, Transaction, CurrentBlockData } from './types.js'

class Blockchain {
  chain: Block[] = []
  pendingTransactions: Transaction[] = []
  currentNodeId: string = NODE_ADDRESS
  currentNodeURL: string = process.argv[3]
  networkNodes: string[] = []

  constructor() {
    this.createNewBlock(1, 'genesis', 'before-genesis-was-god')
  }

  createNewBlock(nonce: number, hash: string, previousBlockHash: string): void {
    const newBlock = {
      nonce,
      hash,
      previousBlockHash,
      index: this.chain.length + 1, // blockNumber
      transactions: this.pendingTransactions,
      timestamp: Math.floor(Date.now() / 1000),
    }
    this.chain.push(newBlock)
    this.pendingTransactions = []
  }

  createNewTransaction(amount: number, sender: string, recipient: string): Transaction {
    const newTransaction: Transaction = {
      transactionId: getUniqueId(),
      amount,
      sender,
      recipient,
    }
    return newTransaction
  }

  addTransactionToPendingTransactions(newTransaction: Transaction): void {
    this.pendingTransactions.push(newTransaction)
  }

  getLastBlock(): Block {
    return this.chain[this.chain.length - 1]
  }

  getBlockHash(nonce: number, previousBlockHash: string, currentBlockData: CurrentBlockData): string {
    const dataAsString = nonce.toString() + previousBlockHash + JSON.stringify(currentBlockData)
    const hash = getHashSHA256(dataAsString)
    return hash
  }

  getNonceByProofOfWork(previousBlockHash: string, currentBlockData: CurrentBlockData) {
    let nonce = 0
    let hash = this.getBlockHash(nonce, previousBlockHash, currentBlockData)
    while (hash.substring(0, 4) !== '0000') {
      nonce++
      hash = this.getBlockHash(nonce, previousBlockHash, currentBlockData)
    }
    return nonce
  }

  /**
   * 1. Check if the genesis block is valid
   * 2. Rehash the current block and check if it's valid (starts with 4 zeros)
   * 3. Check if the hashes chain is correct
   */
  isValidChain(blockchain: Block[]): boolean {
    const genesisBlock = blockchain[0]
    if (genesisBlock.hash !== 'genesis') return false
    if (genesisBlock.previousBlockHash !== 'before-genesis-was-god') return false
    if (genesisBlock.nonce !== 1) return false
    if (genesisBlock.transactions.length !== 0) return false

    for (let i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i]
      const prevBlock = blockchain[i - 1]

      const currentBlockData: CurrentBlockData = {
        index: currentBlock.index,
        transactions: currentBlock.transactions,
      }

      const currentBlockHash = this.getBlockHash(currentBlock.nonce, prevBlock.hash, currentBlockData)
      if (currentBlockHash.substring(0, 4) !== '0000') return false
      if (currentBlock.previousBlockHash !== prevBlock.hash) return false
    }
    return true
  }
}

export default Blockchain

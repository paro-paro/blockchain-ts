export interface Block {
  nonce: number
  hash: string
  previousBlockHash: string
  index: number
  transactions: Transaction[]
  timestamp: number
}

export interface Transaction {
  transactionId: string
  amount: number
  sender: string
  recipient: string
}

export interface CurrentBlockData {
  index: number
  transactions: Transaction[]
}

export interface NewBlockProps {
  nonce: number
  hash: string
  previousBlockHash: string
}

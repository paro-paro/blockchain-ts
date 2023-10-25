import { Request, Response } from 'express'
import { blockchain } from '../server.js'
import { isAddNodeURL, getPostRequestOptions, getBroadcastPromises, handleRequestError } from '../utils.js'

export const registerNode = function (req: Request, res: Response) {
  const newNodeURL: string = req.body.newNodeURL
  const isAdd = isAddNodeURL(newNodeURL, blockchain.currentNodeURL, blockchain.networkNodes)
  if (isAdd) blockchain.networkNodes.push(newNodeURL)
  res.send({ msg: 'New node registered successfully' })
}

export const registerNodeAll = function (req: Request, res: Response) {
  const allNetworkNodes: string[] = req.body.allNetworkNodes
  allNetworkNodes.forEach((url) => {
    const isAdd = isAddNodeURL(url, blockchain.currentNodeURL, blockchain.networkNodes)
    if (isAdd) blockchain.networkNodes.push(url)
  })
  res.send({ msg: 'All nodes registered succesfully' })
}

/**
 * Register and broadcast a new node into the network
 * Once this endpoint is successfully executed, the new node will be part of the network
 */
export const registerAndBroadcastNode = async function (req: Request, res: Response) {
  const newNodeURL: string = req.body.newNodeURL
  if (newNodeURL === blockchain.currentNodeURL) {
    res.status(500).send('Error: current node URL and new node URL are the same.')
    return
  }

  // register new node in current node
  const isAdd = isAddNodeURL(newNodeURL, blockchain.currentNodeURL, blockchain.networkNodes)
  if (isAdd) blockchain.networkNodes.push(newNodeURL)

  try {
    // broadcast new node to all other nodes
    const promises = getBroadcastPromises(blockchain.networkNodes, '/register-node', { newNodeURL })
    await Promise.all(promises) // note: missing responses check for ok status!

    // register all existing nodes in the new node
    const url = newNodeURL + '/register-node-all'
    const requestOptions = getPostRequestOptions({
      allNetworkNodes: [blockchain.currentNodeURL, ...blockchain.networkNodes],
    })

    await fetch(url, requestOptions) // note: missing response check for ok status!
    res.json({ msg: 'New node registered and broadcasted successfully' })
  } catch (error) {
    const msg = handleRequestError(error)
    res.status(500).send(msg)
  }
}

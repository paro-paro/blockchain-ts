const broadcasterNode = 'http://localhost:3001'
const nodes = [
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:3005',
]

const promises = nodes.map(async (node) => {
  const url = broadcasterNode + '/register-broadcast-node'
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newNodeURL: node }),
  }
  return await fetch(url, requestOptions)
})

try {
  const responses = await Promise.all(promises)
  if (responses.some((response) => !response.ok)) {
    throw new Error('broadcast error')
  }
  console.log('Decentralized blockchain network created successfully.')
} catch (error) {
  if (error instanceof Error) {
    console.log('Error creating network:', error.message)
  } else {
    console.log('Error creating network.')
  }
}

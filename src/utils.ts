import crypto from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'

export const getHashSHA256 = function (string: string): string {
  return crypto.createHash('sha256').update(string).digest('hex')
}

export const getUniqueId = function (): string {
  return uuidv4().split('-').join('')
}

export const isAddNodeURL = function (
  urlToAdd: string,
  currentNodeURL: string,
  networkNodes: string[]
): boolean {
  const isSameNodeURL = currentNodeURL === urlToAdd
  const isAlreadyRegistered = networkNodes.includes(urlToAdd)
  return !isSameNodeURL && !isAlreadyRegistered
}

export const handleRequestError = function (error: unknown): string {
  if (error instanceof Error) {
    return error.message
  } else {
    return 'Unknown Error'
  }
}

export const getPostRequestOptions = function (payload?: object): object {
  const config = { method: 'POST', headers: { 'Content-Type': 'application/json' } }
  if (payload) {
    return {
      ...config,
      body: JSON.stringify(payload),
    }
  }
  return config
}

/**
 * fetch API note:
 * A fetch() promise only rejects when a network error is encountered (which is usually when there's a permissions issue or similar).
 * A fetch() promise does not reject on HTTP errors (404, etc.). Instead, a then() handler must check the Response.ok and/or Response.status properties.
 * For simplicity, we are not performing the responses check in this project.
 */
export const getBroadcastPromises = function (
  networkNodes: string[],
  endpoint: string,
  payload?: object
): Promise<Response>[] {
  return networkNodes.map(async (networkNodeURL) => {
    const url = networkNodeURL + endpoint
    const requestOptions = getPostRequestOptions(payload)
    return await fetch(url, requestOptions)
  })
}

// not in use
export const detectBroadcastError = function (responses: globalThis.Response[]): boolean {
  return responses.some((response) => !response.ok)
}

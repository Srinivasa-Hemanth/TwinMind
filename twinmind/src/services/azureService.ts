declare const process: {
  env?: Record<string, string | undefined>
}

const getEnv = (key: string): string | undefined => {
  // Vite / modern bundlers: import.meta.env
  const metaEnv = (import.meta.env as unknown) as Record<string, unknown>
  const value = metaEnv[key]
  if (typeof value === 'string') {
    return value
  }
  // CRA / Node-style: process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]
  }
  return undefined
}

const AZURE_ENDPOINT = getEnv('REACT_APP_AZURE_OPENAI_ENDPOINT')
const AZURE_KEY = getEnv('REACT_APP_AZURE_OPENAI_KEY')
const AZURE_DEPLOYMENT = getEnv('REACT_APP_AZURE_DEPLOYMENT_NAME')
const AZURE_SEARCH_ENDPOINT = getEnv('REACT_APP_AZURE_SEARCH_ENDPOINT')
const AZURE_SEARCH_KEY = getEnv('REACT_APP_AZURE_SEARCH_KEY')
const AZURE_SEARCH_INDEX = getEnv('REACT_APP_AZURE_SEARCH_INDEX')

export function isAzureConfigured(): boolean {
  return Boolean(
    AZURE_ENDPOINT &&
      AZURE_KEY &&
      AZURE_DEPLOYMENT &&
      AZURE_SEARCH_ENDPOINT &&
      AZURE_SEARCH_KEY &&
      AZURE_SEARCH_INDEX,
  )
}

export async function generateAzureAnswer(
  question: string,
): Promise<string | null> {
  if (!isAzureConfigured()) {
    throw new Error('Azure OpenAI is not configured.')
  }

  const endpoint = AZURE_ENDPOINT!
  const deployment = AZURE_DEPLOYMENT!
  const key = AZURE_KEY!

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': key,
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.2,
      max_tokens: 800,
      data_sources: [
        {
          type: 'azure_search',
          parameters: {
            endpoint: AZURE_SEARCH_ENDPOINT,
            key: AZURE_SEARCH_KEY,
            index_name: AZURE_SEARCH_INDEX,
          },
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Azure OpenAI request failed with status ${response.status}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return null
  }

  return content
}


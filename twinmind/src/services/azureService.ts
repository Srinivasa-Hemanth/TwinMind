declare const process: {
  env?: Record<string, string | undefined>
}

const AZURE_ENDPOINT = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || import.meta.env.REACT_APP_AZURE_OPENAI_ENDPOINT
const AZURE_KEY = (import.meta.env.VITE_AZURE_OPENAI_KEY || import.meta.env.REACT_APP_AZURE_OPENAI_KEY)?.replace(/^["']|["']$/g, '').trim()
const AZURE_DEPLOYMENT = import.meta.env.VITE_AZURE_DEPLOYMENT_NAME || import.meta.env.REACT_APP_AZURE_DEPLOYMENT_NAME

// Normalize endpoint to ignore the default template placeholder
const getEndpoint = () => {
  if (!AZURE_ENDPOINT) return undefined
  if (AZURE_ENDPOINT.includes('your-resource-name')) return undefined
  return AZURE_ENDPOINT
}

// Normalize deployment to ignore the default template placeholder
const getDeployment = () => {
  if (!AZURE_DEPLOYMENT) return undefined
  if (AZURE_DEPLOYMENT === 'twinmind') return undefined
  return AZURE_DEPLOYMENT
}

export function isAzureConfigured(): boolean {
  // We only strictly need the key. If endpoint is missing, we assume standard OpenAI.
  return Boolean(AZURE_KEY)
}

export async function generateAzureAnswer(
  messages: Array<{ role: string; content: string }>,
): Promise<string | null> {
  if (!isAzureConfigured()) {
    throw new Error('Azure OpenAI is not configured.')
  }

  const endpoint = getEndpoint()
  const deployment = getDeployment() || 'gpt-4o-mini'
  const key = AZURE_KEY!

  const isAzure = Boolean(endpoint)
  const url = isAzure
    ? `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`
    : 'https://api.openai.com/v1/chat/completions'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (isAzure) {
    headers['api-key'] = key
  } else {
    headers['Authorization'] = `Bearer ${key}`
  }

  let localDocsContext = ''
  try {
    const docsReq = await fetch('/api/get-project-docs')
    if (docsReq.ok) {
      const docs: { filename: string; content: string }[] = await docsReq.json()
      if (docs.length > 0) {
        localDocsContext = '\n\nHere is a comprehensive list of all project documents, task notes, and call transcripts from your local "Projects" directory. You are trained on these. If the user asks questions about any past calls, tasks, or project details, you MUST answer using this data. If the user asks about something not in this data, clearly state that you are not aware of it:\n'
        docs.forEach(doc => {
          localDocsContext += `\n--- File: ${doc.filename} ---\n${doc.content}\n`
        })
      }
    }
  } catch (err) {
    console.warn('Failed to load local project docs for context:', err)
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      headers,
      payload: {
        model: isAzure ? undefined : deployment,
        messages: [
          {
            role: 'system',
            content: `You are TwinMind AI. Answer user questions accurately based on your local project knowledge base. Be conversational and helpful.${localDocsContext}`
          },
          ...messages.map(m => ({
            role: m.role === 'bot' ? 'assistant' : m.role,
            content: m.content
          }))
        ],
        temperature: 0.2,
        max_tokens: 800,
      }
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('OpenAI Error:', errText)
    throw new Error(`Azure OpenAI request failed with status ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return null
  }

  return content
}


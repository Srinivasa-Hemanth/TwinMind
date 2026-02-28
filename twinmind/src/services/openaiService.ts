declare const process: {
  env?: Record<string, string | undefined>
}

const safeEnv = (val?: string) => val ? val.replace(/^["']|["']$/g, '').trim() : undefined

const OPENAI_KEY = safeEnv(import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.REACT_APP_OPENAI_API_KEY)

export function isOpenAIConfigured(): boolean {
  return Boolean(OPENAI_KEY)
}

export async function generateOpenAIAnswer(
  messages: Array<{ role: string; content: string }>,
): Promise<string | null> {
  if (!isOpenAIConfigured()) {
    throw new Error('OpenAI API Key is not configured.')
  }

  const url = 'https://api.openai.com/v1/chat/completions'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_KEY}`
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
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are TwinMind AI. Answer user questions accurately based on your local project knowledge base. Be conversational and helpful. IMPORTANT: The frontend wrapper has Text-to-Speech (TTS) capabilities. If the user asks for a voice message, to speak, or for vocalization, YOU DO HAVE THAT CAPABILITY. Simply answer normally with text and acknowledge you are speaking, because the frontend will automatically read your text response out loud to the user.\n\nCRITICAL CONTEXT INSTRUCTION: If the user asks for a summary of a specific call or meeting (e.g., "summarize today's call with Pravallika"), you MUST scan the provided 'Projects/Calls Transcript' files for a file containing "Call with: [Name]" matching their request, and provide a detailed summary of that exact transcript's contents.${localDocsContext}`
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
    throw new Error(`OpenAI request failed with status ${response.status}: ${errText}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return null
  }

  return content
}


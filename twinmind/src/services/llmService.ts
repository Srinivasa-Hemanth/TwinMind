import type { KnowledgeEntry } from './knowledgeService'
import { extractKeywords } from './searchService'

const FALLBACK_MESSAGE = 'I don’t have information in the knowledge base.'

function splitIntoSentences(text: string): string[] {
  const parts = text
    .replace(/[\r\n]+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  return parts
}

export function generateAnswer(
  contextDocs: KnowledgeEntry[] | null | undefined,
  question: string,
): string {
  if (!contextDocs || contextDocs.length === 0) {
    return FALLBACK_MESSAGE
  }

  const keywords = extractKeywords(question || '')
  if (keywords.length === 0) {
    return FALLBACK_MESSAGE
  }

  type ScoredSentence = {
    sentence: string
    score: number
    fileName: string
  }

  const sentences: ScoredSentence[] = []

  contextDocs.forEach((doc) => {
    const docSentences = splitIntoSentences(doc.content || '')
    const lowerSentences = docSentences.map((s) => s.toLowerCase())

    lowerSentences.forEach((lower, index) => {
      let score = 0
      keywords.forEach((kw) => {
        if (lower.includes(kw)) {
          score += 1
        }
      })
      if (score > 0) {
        sentences.push({
          sentence: docSentences[index],
          score,
          fileName: doc.fileName,
        })
      }
    })
  })

  if (sentences.length === 0) {
    return FALLBACK_MESSAGE
  }

  sentences.sort((a, b) => b.score - a.score)

  const maxChars = 900
  const selected: ScoredSentence[] = []
  let totalChars = 0

  for (const s of sentences) {
    if (totalChars + s.sentence.length > maxChars) break
    selected.push(s)
    totalChars += s.sentence.length
  }

  if (selected.length === 0) {
    return FALLBACK_MESSAGE
  }

  const lines: string[] = []
  lines.push(
    'Here is what I found in your knowledge base related to your question:',
  )

  selected.forEach((item, index) => {
    lines.push(
      `${index + 1}. [${item.fileName}] ${item.sentence}`,
    )
  })

  lines.push(
    'All information above comes directly from your uploaded files or transcripts.',
  )

  return lines.join('\n')
}


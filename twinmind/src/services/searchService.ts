import type { KnowledgeEntry } from './knowledgeService'

export interface ScoredDocument {
  doc: KnowledgeEntry
  score: number
}

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'if',
  'in',
  'on',
  'at',
  'for',
  'to',
  'from',
  'of',
  'is',
  'are',
  'was',
  'were',
  'be',
  'this',
  'that',
  'it',
  'as',
  'with',
  'by',
])

export function extractKeywords(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))

  return Array.from(new Set(normalized))
}

export function scoreDocument(
  doc: KnowledgeEntry,
  keywords: string[],
): number {
  if (!doc.content || keywords.length === 0) return 0
  const text = doc.content.toLowerCase()
  let score = 0
  keywords.forEach((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'g')
    const matches = text.match(regex)
    if (matches) {
      score += matches.length
    }
  })
  return score
}

export function searchKnowledgeBase(
  knowledgeBase: KnowledgeEntry[],
  question: string,
  maxResults = 3,
): ScoredDocument[] {
  const keywords = extractKeywords(question)
  if (keywords.length === 0) return []

  const scored: ScoredDocument[] = knowledgeBase
    .map((doc) => ({
      doc,
      score: scoreDocument(doc, keywords),
    }))
    .filter((item) => item.score > 0)

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, maxResults)
}


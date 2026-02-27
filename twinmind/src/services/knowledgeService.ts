export interface KnowledgeEntry {
  id: string
  fileName: string
  content: string
  createdDate: string
  isTranscript?: boolean
}

const LOCAL_STORAGE_KEY = 'twinmind_knowledge_base_v1'

export function loadKnowledgeBase(): KnowledgeEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => typeof item === 'object' && item !== null)
  } catch {
    return []
  }
}

export function saveKnowledgeBase(entries: KnowledgeEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // ignore storage errors
  }
}

interface CreateKnowledgeEntryOptions {
  fileName: string
  content: string
  createdDateOverride?: string
  isTranscript?: boolean
}

export function createKnowledgeEntry(
  options: CreateKnowledgeEntryOptions,
): KnowledgeEntry {
  const now = new Date()
  const id = `${now.getTime()}-${Math.random().toString(16).slice(2)}`
  const content = (options.content || '').replace(/\r\n/g, '\n').trim()

  return {
    id,
    fileName: options.fileName,
    content,
    createdDate: options.createdDateOverride || now.toISOString(),
    isTranscript: options.isTranscript,
  }
}

export function addKnowledgeEntries(
  existing: KnowledgeEntry[],
  newEntries: KnowledgeEntry[],
): KnowledgeEntry[] {
  const merged = [...existing, ...newEntries]
  merged.sort((a, b) => {
    const aTime = new Date(a.createdDate).getTime()
    const bTime = new Date(b.createdDate).getTime()
    return bTime - aTime
  })
  saveKnowledgeBase(merged)
  return merged
}


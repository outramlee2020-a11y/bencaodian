/**
 * Extract plain text from mixed-format chapter content.
 *
 * The PageContent table stores text in two different formats due to
 * differences in how shidianguji data was imported:
 *
 *   Format A (clean text):  纯文本字符串，段落间用 \n\n 分隔
 *     "重修政和经史证类本草三十卷...\n\n天地以生成為徳..."
 *
 *   Format B (JSON lines):  每段一个 JSON 对象，\n\n 分隔
 *     {"lines":[{"content":"序例上",...}],"indent":0}
 *     \n\n
 *     {"lines":[{"content":"天地以生成為徳",...}],"indent":0}
 */

export function extractText(raw: string): string {
  if (!raw) return ''
  const trimmed = raw.trim()

  // If it doesn't look like JSON, return as-is
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return trimmed
  }

  // Try JSON-paragraph format (each paragraph is a JSON object separated by \n\n)
  if (trimmed.includes('\n\n')) {
    const parts = trimmed.split('\n\n').filter(Boolean)
    const extracted: string[] = []
    let jsonCount = 0

    for (const part of parts) {
      try {
        const parsed = JSON.parse(part)
        const text = extractFromJsonParagraph(parsed)
        if (text) {
          extracted.push(text)
          jsonCount++
          continue
        }
      } catch {
        // Not JSON — treat as plain text paragraph
      }
      extracted.push(part)
    }

    // Only use extracted result if majority of paragraphs were JSON
    if (jsonCount > parts.length / 2) {
      return extracted.join('\n\n')
    }
  }

  // Try single JSON object
  try {
    const parsed = JSON.parse(trimmed)
    const text = extractFromJsonParagraph(parsed)
    if (text) return text
  } catch {
    // Not JSON, use raw text
  }

  return trimmed
}

/**
 * Extract text from a JSON paragraph object.
 *
 * Expected shape:
 *   { "lines": [{ "content": "text", ... }, ...], "indent": 0 }
 *   — or —
 *   { "content": "text" }  (single-line)
 */
function extractFromJsonParagraph(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null

  // Array of line objects with .content
  if (Array.isArray(obj.lines)) {
    const texts = obj.lines
      .filter((l: any) => l && typeof l.content === 'string')
      .map((l: any) => l.content)
      .filter(Boolean)
    if (texts.length > 0) return texts.join('')
  }

  // Single content field
  if (typeof obj.content === 'string') {
    return obj.content
  }

  // If it's an array of paragraphs
  if (Array.isArray(obj)) {
    const texts = obj
      .map((item: any) => extractFromJsonParagraph(item))
      .filter(Boolean)
    if (texts.length > 0) return texts.join('\n\n')
  }

  return null
}

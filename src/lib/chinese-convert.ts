/**
 * Simplified/Traditional Chinese conversion utility.
 * Wraps the chinese-s2t CJS module for ESM/TypeScript compatibility.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Chinese = require('chinese-s2t') as {
  s2t: (text: string) => string
  t2s: (text: string) => string
}

export function simplifiedToTraditional(text: string): string {
  return Chinese.s2t(text)
}

export function traditionalToSimplified(text: string): string {
  return Chinese.t2s(text)
}

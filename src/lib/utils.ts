// Chinese text processing utilities

const TRADITIONAL_TO_SIMPLIFIED: Record<string, string> = {}
const SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {}

// Basic mapping for common characters
const COMMON_T2S: Record<string, string> = {
  '學': '学', '習': '习', '時': '时', '說': '说', '語': '语',
  '論': '论', '經': '经', '書': '书', '國': '国', '聖': '圣',
  '賢': '贤', '醫': '医', '藥': '药', '體': '体', '氣': '气',
  '門': '门', '問': '问', '關': '关', '開': '开', '發': '发',
  '見': '见', '觀': '观', '瀏': '浏', '覽': '览',
  '術': '术', '數': '数', '點': '点', '頭': '头', '兒': '儿',
  '東': '东', '馬': '马', '魚': '鱼', '鳥': '鸟', '龍': '龙',
  '長': '长', '間': '间', '陽': '阳', '陰': '阴',
  '萬': '万', '與': '与', '為': '为', '會': '会', '從': '从',
  '來': '来', '雲': '云', '電': '电', '風': '风', '聲': '声',
  '聽': '听', '樂': '乐', '禮': '礼', '舊': '旧', '難': '难',
  '歡': '欢', '還': '还', '進': '进', '過': '过', '這': '这',
  '邊': '边', '個': '个', '種': '种', '樣': '样', '類': '类',
}

// Reverse for simplified to traditional
Object.entries(COMMON_T2S).forEach(([t, s]) => {
  TRADITIONAL_TO_SIMPLIFIED[t] = s
  SIMPLIFIED_TO_TRADITIONAL[s] = t
})

export function traditionalToSimplified(text: string): string {
  return text.split('').map(c => TRADITIONAL_TO_SIMPLIFIED[c] || c).join('')
}

export function simplifiedToTraditional(text: string): string {
  return text.split('').map(c => SIMPLIFIED_TO_TRADITIONAL[c] || c).join('')
}

export function formatDynasty(dynasty: string): string {
  const dynastyMap: Record<string, string> = {
    '先秦': 'Pre-Qin',
    '汉': 'Han',
    '西汉': 'Western Han',
    '东汉': 'Eastern Han',
    '晋': 'Jin',
    '唐': 'Tang',
    '宋': 'Song',
    '北宋': 'Northern Song',
    '南宋': 'Southern Song',
    '元': 'Yuan',
    '明': 'Ming',
    '清': 'Qing',
  }
  return dynastyMap[dynasty] || dynasty
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export function highlightSearchTerm(text: string, term: string): string {
  if (!term) return text
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

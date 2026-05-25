import { NextRequest, NextResponse } from 'next/server'

const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions'
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini'

const ENTITY_EXTRACTION_PROMPT = `你是一个中医古籍实体识别系统。请从用户提供的文本中，提取以下类别的中医实体：

1. 中药名（如人参、白术、黄连、甘草等）
2. 病症名（如伤寒、温病、虚劳、痹证等）
3. 穴位名（如足三里、曲池、合谷等）
4. 方剂名（如麻黄汤、桂枝汤、六味地黄丸等）
5. 人名（医家名，如张仲景、孙思邈等）
6. 经典名（如《黄帝内经》、《伤寒论》等）

返回格式：纯 JSON 数组，每个对象包含：{ "name": "实体名", "category": "drug|symptom|point|prescription|person|classic", "count": 出现次数 }

只返回 JSON，不要附加任何说明文字。如果没有找到任何实体，返回 [].`

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ success: false, error: '缺少文本内容' }, { status: 400 })
    }

    // For small texts, skip AI and use the offline dictionary
    if (text.length < 50) {
      return NextResponse.json({ success: true, data: extractLocalEntities(text) })
    }

    if (!AI_API_KEY) {
      // Demo mode: use offline extraction
      return NextResponse.json({ success: true, data: extractLocalEntities(text) })
    }

    // Call AI API
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: ENTITY_EXTRACTION_PROMPT },
          { role: 'user', content: text.slice(0, 4000) },
        ],
        temperature: 0.1,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Entity API error:', res.status, errText)
      return NextResponse.json({ success: true, data: extractLocalEntities(text) })
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || '[]'

    // Parse AI response (it should be JSON)
    try {
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim()
      const entities = JSON.parse(cleaned)
      return NextResponse.json({ success: true, data: entities, source: 'ai' })
    } catch {
      // AI returned non-JSON, fallback
      return NextResponse.json({ success: true, data: extractLocalEntities(text), source: 'dict' })
    }
  } catch (error) {
    console.error('Entity extraction error:', error)
    return NextResponse.json({ success: true, data: [], source: 'error' })
  }
}

/**
 * Local entity extraction using the offline TCM dictionary.
 * Used when AI API is not available or for small texts.
 */
function extractLocalEntities(text: string): Array<{ name: string; category: string; count: number }> {
  const dict: Record<string, string> = {
    // TCM drugs (from tcm-dictionary)
    '人参': 'drug', '白术': 'drug', '黄芪': 'drug', '甘草': 'drug',
    '当归': 'drug', '川芎': 'drug', '茯苓': 'drug', '半夏': 'drug',
    '陈皮': 'drug', '麻黄': 'drug', '桂枝': 'drug', '附子': 'drug',
    '柴胡': 'drug', '白芍': 'drug', '丹参': 'drug', '桃仁': 'drug',
    '杏仁': 'drug', '黄连': 'drug', '黄芩': 'drug', '大黄': 'drug',
    '生地': 'drug', '麦冬': 'drug', '细辛': 'drug', '葛根': 'drug',
    '生姜': 'drug', '大枣': 'drug', '薄荷': 'drug', '菊花': 'drug',
    '栀子': 'drug', '肉桂': 'drug', '升麻': 'drug',
    // Symptoms
    '伤寒': 'symptom', '温病': 'symptom', '虚劳': 'symptom', '痹证': 'symptom',
    '咳嗽': 'symptom', '痰饮': 'symptom', '瘀血': 'symptom', '痞满': 'symptom',
    '发热': 'symptom', '头痛': 'symptom', '呕吐': 'symptom', '泄泻': 'symptom',
    '水肿': 'symptom', '黄疸': 'symptom', '消渴': 'symptom',
    // Classics
    '黄帝内经': 'classic', '伤寒论': 'classic', '金匮要略': 'classic',
    '本草纲目': 'classic', '神农本草经': 'classic', '难经': 'classic',
    '温病条辨': 'classic',
    // People
    '张仲景': 'person', '孙思邈': 'person', '李时珍': 'person',
    '华佗': 'person', '扁鹊': 'person', '王叔和': 'person',
    // Prescriptions
    '麻黄汤': 'prescription', '桂枝汤': 'prescription', '小柴胡汤': 'prescription',
    '四君子汤': 'prescription', '四物汤': 'prescription', '六味地黄丸': 'prescription',
    '八珍汤': 'prescription', '十全大补汤': 'prescription',
    '补中益气汤': 'prescription', '归脾汤': 'prescription',
  }

  const result: Record<string, { name: string; category: string; count: number }> = {}

  for (const [name, category] of Object.entries(dict)) {
    const matches = text.match(new RegExp(name, 'g'))
    if (matches) {
      result[name] = { name, category, count: matches.length }
    }
  }

  return Object.values(result).sort((a, b) => b.count - a.count)
}

import { NextRequest, NextResponse } from 'next/server'

const AI_API_URL = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions'
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini'

const BASE_SYSTEM_PROMPT = `你是本草典AI助手，专门回答关于中医古籍、本草学、中医药理论的问题。
你精通《黄帝内经》《伤寒论》《金匮要略》《本草纲目》《神农本草经》等中医经典。
请用中文回答，保持专业准确，适当引经据典。
如果用户问的是与现代医学相关的问题，请同时从中医和现代医学角度回答。
如果不确定答案，请坦诚说明，不要编造信息。`

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages, stream = false, bookId, chapterId, chapterContent, chapterTitle } = await request.json()

    // Inject chapter context into system prompt
    let systemPrompt = BASE_SYSTEM_PROMPT
    if (chapterContent) {
      systemPrompt += `\n\n## 当前阅读内容\n用户正在阅读《${chapterTitle || '未知章节'}》，以下是该章节的文本内容（用于回答用户问题时引用和参考）：\n\n${chapterContent}\n\n请优先基于上述文本内容回答用户的问题。回答时可以引用原文。`
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: '消息不能为空' },
        { status: 400 }
      )
    }

    if (!AI_API_KEY) {
      // Demo mode: return a simulated response
      const lastMsg = messages[messages.length - 1]?.content || ''
      const demoResponse = generateDemoResponse(lastMsg)

      if (stream) {
        const encoder = new TextEncoder()
        const chunks = demoResponse.split('')
        const readable = new ReadableStream({
          async start(controller) {
            for (const char of chunks) {
              const data = JSON.stringify({ choices: [{ delta: { content: char } }] })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              await new Promise(r => setTimeout(r, 20))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          },
        })
        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          },
        })
      }

      return NextResponse.json({
        success: true,
        data: {
          message: { role: 'assistant', content: demoResponse },
        },
      })
    }

    // Real API call
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ]

    if (stream) {
      const res = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: apiMessages,
          stream: true,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        return NextResponse.json(
          { success: false, error: `API错误: ${res.status} ${errText}` },
          { status: 502 }
        )
      }

      return new Response(res.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: apiMessages,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { success: false, error: `API错误: ${res.status} ${errText}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json({
      success: true,
      data: {
        message: data.choices?.[0]?.message || null,
      },
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { success: false, error: 'AI服务暂时不可用' },
      { status: 500 }
    )
  }
}

function generateDemoResponse(query: string): string {
  const q = query.toLowerCase()
  if (q.includes('本草')) {
    return '「本草」二字，始见于《神农本草经》，\"本\"指草木之根，\"草\"为草本植物之总称。本草学是研究药物的名称、性味、功效、主治、产地、采集、炮制、配伍等知识的学科。\n\n正如《本草纲目》序中所言：\"医者，人之司命也；本草者，医之辅佐也。\"可见本草学在中医体系中的重要地位。'
  }
  if (q.includes('黄帝内经') || q.includes('内经')) {
    return '《黄帝内经》是我国现存最早的中医理论经典，成书于战国至秦汉时期，并非一时一人之作。全书分为《素问》和《灵枢》两部分，各九卷八十一篇。\n\n《素问》主要论述人体生理、病理、诊断、治疗等基础理论；《灵枢》则侧重于经络、针灸。其核心理论包括阴阳五行学说、藏象学说、经络学说、病因病机学说等，奠定了中医理论体系的基石。\n\n正如《素问·上古天真论》所言：\"上古之人，其知道者，法于阴阳，和于术数，食饮有节，起居有常，不妄作劳，故能形与神俱，而尽终其天年，度百岁乃去。\"'
  }
  if (q.includes('阴阳') || q.includes('五行')) {
    return '阴阳五行学说是中医理论的哲学基础。\n\n阴阳学说认为，世界是由阴阳二气构成的，二者对立统一、消长平衡。《素问·阴阳应象大论》曰：\"阴阳者，天地之道也，万物之纲纪，变化之父母，生杀之本始，神明之府也。\"\n\n五行学说将自然界和人体的一切事物归为木、火、土、金、水五大类，相生相克、制化有序。木生火、火生土、土生金、金生水、水生木；木克土、土克水、水克火、火克金、金克木。\n\n在临床应用中，阴阳五行用于分析病因、归纳证候、指导用药，是辨证论治的重要工具。'
  }
  return `您好！我是本草典AI助手，专注于中医古籍和中医药知识的问答。\n\n您可以问我以下类型的问题：\n- 中医经典著作的内容（如《黄帝内经》《伤寒论》）\n- 本草药物知识（性味、功效、主治）\n- 中医基础理论（阴阳五行、藏象经络）\n- 方剂配伍与应用\n- 养生保健方法\n\n请告诉我您想了解什么？`
}

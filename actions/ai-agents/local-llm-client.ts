"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Local Open-Source Vision & LLM Client (Ollama / vLLM / FastAPI)
 * Görev: Ticari API'lerden (OpenAI/Gemini) tamamen bağımsız, sıfır maliyetli
 * yerel açık kaynak modele (Örn: http://localhost:11434/api/chat veya process.env.LOCAL_AI_ENDPOINT)
 * istek atan özel fetch istemcisi.
 */

export interface LocalLLMMessage {
  role: "system" | "user" | "assistant"
  content: string
  images?: string[]
}

export interface LocalLLMResponse<T = any> {
  success: boolean
  endpoint: string
  model: string
  rawContent: string | null
  parsedJson: T | null
  latencyMs: number
  error?: string
}

/**
 * Yerel Açık Kaynak Yapay Zeka Modeline (Ollama / vLLM / Python FastAPI) HTTP fetch isteği atar.
 */
export async function queryLocalVisionLLM<T = any>(params: {
  systemPrompt: string
  userPrompt: string
  documentUrl?: string
  model?: string
  temperature?: number
}): Promise<LocalLLMResponse<T>> {
  const startTime = Date.now()
  const endpoint =
    process.env.LOCAL_AI_ENDPOINT || "http://localhost:11434/api/chat"
  const model =
    params.model ||
    process.env.LOCAL_AI_MODEL ||
    "llama3.2-vision:11b"

  const messages: LocalLLMMessage[] = [
    {
      role: "system",
      content: params.systemPrompt,
    },
    {
      role: "user",
      content: params.userPrompt,
    },
  ]

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        format: "json",
        options: {
          temperature: params.temperature ?? 0.1,
        },
        documentUrl: params.documentUrl,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        endpoint,
        model,
        rawContent: null,
        parsedJson: null,
        latencyMs: Date.now() - startTime,
        error: `Local LLM HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()

    // Ollama (/api/chat -> data.message.content), vLLM (/v1/chat/completions -> data.choices[0].message.content) veya FastAPI (data.output / data.response) desteği
    const rawContent: string | null =
      data?.message?.content ??
      data?.choices?.[0]?.message?.content ??
      data?.response ??
      data?.output ??
      (typeof data === "string" ? data : null)

    if (!rawContent) {
      return {
        success: false,
        endpoint,
        model,
        rawContent: null,
        parsedJson: null,
        latencyMs: Date.now() - startTime,
        error: "Yerel modelden boş yanıt döndü.",
      }
    }

    const cleanedJson = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim()

    const parsedJson = JSON.parse(cleanedJson) as T

    return {
      success: true,
      endpoint,
      model,
      rawContent,
      parsedJson,
      latencyMs: Date.now() - startTime,
    }
  } catch (err: any) {
    return {
      success: false,
      endpoint,
      model,
      rawContent: null,
      parsedJson: null,
      latencyMs: Date.now() - startTime,
      error: err?.message || "Yerel LLM sunucusuna ulaşılamadı (Fallback aktif).",
    }
  }
}

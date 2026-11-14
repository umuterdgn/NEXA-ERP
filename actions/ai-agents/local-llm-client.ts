"use server"
/**
 * © 2026 NXA Software. All rights reserved.
 * Developer: Umut Erdoğan
 * Local Open-Source Ollama Vision & LLM Client (localhost:11434)
 * Görev: Hiçbir bulut veya API maliyeti yaratmayacak şekilde kullanıcının kendi
 * bilgisayarında çalışan lokal Ollama servisine (http://localhost:11434/api/generate veya /api/chat)
 * bağlanır ve 'llama3.2-vision' / 'llava' açık kaynak vizyon modellerini tetikler.
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
 * Lokal Ollama Servisine (http://localhost:11434/api/generate veya /api/chat) HTTP fetch isteği atar.
 */
export async function queryLocalVisionLLM<T = any>(params: {
  systemPrompt: string
  userPrompt: string
  documentUrl?: string
  model?: "llama3.2-vision" | "llava" | string
  temperature?: number
}): Promise<LocalLLMResponse<T>> {
  const startTime = Date.now()

  // ADIM 1: Çevresel değişkenlere (ENV) fallback mekanizması ile lokal Ollama portuna ayarla
  const aiEndpoint =
    process.env.LOCAL_AI_URL ||
    process.env.LOCAL_AI_ENDPOINT ||
    "http://localhost:11434/api/generate"

  // Lokaldeki açık kaynak vizyon modelini tetikle ('llama3.2-vision' veya 'llava')
  const model =
    params.model ||
    process.env.LOCAL_AI_MODEL ||
    "llama3.2-vision"

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

  // Hem /api/generate (prompt + system) hem de /api/chat (messages) formatıyla tam uyumlu payload
  const combinedPrompt = `${params.systemPrompt}\n\nKullanıcı İsteği:\n${params.userPrompt}`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(aiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        system: params.systemPrompt,
        prompt: combinedPrompt,
        messages,
        stream: false,
        format: "json",
        options: {
          temperature: params.temperature ?? 0.1,
          fallbackModel: "llava",
        },
        documentUrl: params.documentUrl,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        endpoint: aiEndpoint,
        model,
        rawContent: null,
        parsedJson: null,
        latencyMs: Date.now() - startTime,
        error: `Local Ollama HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const data = await response.json()

    // Ollama /api/generate (data.response) ve /api/chat (data.message.content) yanıt desteği
    const rawContent: string | null =
      data?.response ??
      data?.message?.content ??
      data?.choices?.[0]?.message?.content ??
      data?.output ??
      (typeof data === "string" ? data : null)

    if (!rawContent) {
      return {
        success: false,
        endpoint: aiEndpoint,
        model,
        rawContent: null,
        parsedJson: null,
        latencyMs: Date.now() - startTime,
        error: "Lokal Ollama modelinden boş yanıt döndü.",
      }
    }

    const cleanedJson = rawContent
      .replace(/^```json\s*/i, "")
      .replace(/```$/i, "")
      .trim()

    const parsedJson = JSON.parse(cleanedJson) as T

    return {
      success: true,
      endpoint: aiEndpoint,
      model,
      rawContent,
      parsedJson,
      latencyMs: Date.now() - startTime,
    }
  } catch (err: any) {
    return {
      success: false,
      endpoint: aiEndpoint,
      model,
      rawContent: null,
      parsedJson: null,
      latencyMs: Date.now() - startTime,
      error:
        err?.message ||
        "Lokal Ollama (localhost:11434) servisine ulaşılamadı (Few-Shot Fallback aktif).",
    }
  }
}

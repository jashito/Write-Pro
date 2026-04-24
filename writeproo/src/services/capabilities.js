export const OLLAMA_PROBE_TIMEOUT_MS = 1000

function normalizeOllamaBase() {
  const raw = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
  return String(raw).replace(/\/+$/, '')
}

function languageToolConfigured() {
  const u = import.meta.env.VITE_LANGUAGETOOL_URL
  return typeof u === 'string' && u.trim().length > 0
}

/**
 * Comprueba si Ollama responde en la URL configurada (mismo patrón que el CONTEXT: `/api/tags`, timeout 1s).
 * Incluye flags estáticos útiles para la barra de estado (LanguageTool, Transformers bajo demanda).
 *
 * @returns {Promise<{ ok: true, languageToolConfigured: boolean, ollama: boolean, ollamaUrl: string, defaultModel: string | null, transformers: 'lazy' } | { ok: false, error: string }>}
 */
export async function detectCapabilities() {
  const lt = languageToolConfigured()
  const ollamaUrl = normalizeOllamaBase()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OLLAMA_PROBE_TIMEOUT_MS)

  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      return {
        ok: true,
        languageToolConfigured: lt,
        ollama: false,
        ollamaUrl,
        defaultModel: null,
        transformers: 'lazy',
      }
    }

    let defaultModel = null
    try {
      const data = await res.json()
      const models = data?.models
      if (Array.isArray(models) && models.length > 0 && typeof models[0]?.name === 'string') {
        defaultModel = models[0].name
      }
    } catch {
      /* cuerpo no JSON: Ollama sigue marcado como disponible si HTTP OK */
    }

    return {
      ok: true,
      languageToolConfigured: lt,
      ollama: true,
      ollamaUrl,
      defaultModel,
      transformers: 'lazy',
    }
  } catch {
    clearTimeout(timer)
    return {
      ok: true,
      languageToolConfigured: lt,
      ollama: false,
      ollamaUrl,
      defaultModel: null,
      transformers: 'lazy',
    }
  }
}

/**
 * Modelos ONNX (Transformers.js): carga perezosa vía `import()` para no bloquear el arranque.
 * `env.useBrowserCache` reutiliza descargas en el navegador (Cache API del cliente).
 */

const SENTIMENT_MODEL = 'Xenova/bert-base-multilingual-uncased-sentiment'
const REWRITE_MODEL = 'Xenova/flan-t5-small'

/** @type {Promise<typeof import('@xenova/transformers')> | null} */
let transformersModulePromise = null
/** @type {Promise<unknown> | null} */
let sentimentPipelinePromise = null
/** @type {Promise<unknown> | null} */
let text2textPipelinePromise = null

let envConfigured = false

async function loadTransformersModule() {
  if (!transformersModulePromise) {
    transformersModulePromise = import('@xenova/transformers').then((m) => {
      if (!envConfigured) {
        m.env.useBrowserCache = true
        m.env.allowRemoteModels = true
        m.env.allowLocalModels = false
        envConfigured = true
      }
      return m
    })
  }
  return transformersModulePromise
}

/** @param {unknown} info */
function noopProgress(info) {
  void info
}

/**
 * @param {{ onProgress?: (info: unknown) => void }} [opts]
 */
async function getSentimentPipeline(opts = {}) {
  const { pipeline } = await loadTransformersModule()
  const onProgress = opts.onProgress ?? noopProgress
  if (!sentimentPipelinePromise) {
    sentimentPipelinePromise = pipeline('sentiment-analysis', SENTIMENT_MODEL, {
      quantized: true,
      progress_callback: onProgress,
    })
  }
  return sentimentPipelinePromise
}

/**
 * @param {{ onProgress?: (info: unknown) => void }} [opts]
 */
async function getText2TextPipeline(opts = {}) {
  const { pipeline } = await loadTransformersModule()
  const onProgress = opts.onProgress ?? noopProgress
  if (!text2textPipelinePromise) {
    text2textPipelinePromise = pipeline('text2text-generation', REWRITE_MODEL, {
      quantized: true,
      progress_callback: onProgress,
    })
  }
  return text2textPipelinePromise
}

/**
 * Tono avanzado (clasificación multilingüe, etiquetas tipo estrellas).
 * @param {string} text
 * @param {{ onProgress?: (info: unknown) => void }} [opts]
 * @returns {Promise<{ ok: true, empty?: true, details: Array<{ label: string, score: number }> } | { ok: false, error: string }>}
 */
export async function analyzeToneTransformers(text, opts = {}) {
  try {
    const slice = String(text ?? '').trim().slice(0, 512)
    if (!slice) {
      return { ok: true, empty: true, details: [] }
    }

    const pipe = await getSentimentPipeline(opts)
    const out = await pipe(slice, { topk: 3 })
    const rows = Array.isArray(out) ? out : out && typeof out === 'object' ? [out] : []
    const details = rows.map((x) => ({
      label: String(x?.label ?? ''),
      score: Number(x?.score) || 0,
    }))
    return { ok: true, details }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

/**
 * Reescritura básica (Flan-T5 small, texto→texto).
 * @param {string} text
 * @param {{ onProgress?: (info: unknown) => void }} [opts]
 * @returns {Promise<{ ok: true, text: string } | { ok: false, error: string }>}
 */
export async function rewriteBasicTransformers(text, opts = {}) {
  try {
    const slice = String(text ?? '').trim().slice(0, 400)
    if (!slice) {
      return { ok: false, error: 'Texto vacío' }
    }

    const gen = await getText2TextPipeline(opts)
    const prefix = 'Rewrite more clearly in the same language: '
    const input = `${prefix}${slice}`
    const out = await gen(input, {
      max_new_tokens: 120,
      temperature: 0.2,
      do_sample: false,
    })

    const raw = Array.isArray(out) ? out[0]?.generated_text : out?.generated_text
    let result = typeof raw === 'string' ? raw : ''
    if (result.startsWith(input)) {
      result = result.slice(input.length).trim()
    } else if (result.startsWith(prefix)) {
      result = result.slice(prefix.length).trim()
    }
    return { ok: true, text: result || slice }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

/** @deprecated Usa `rewriteBasicTransformers` */
export async function rewriteWithTransformers(text, opts = {}) {
  return rewriteBasicTransformers(text, opts)
}

function normalizeOllamaBase() {
  const raw = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
  return String(raw).replace(/\/+$/, '')
}

/**
 * Reescritura vía Ollama (`POST /api/generate`, sin streaming).
 *
 * @param {string} text
 * @param {{ model?: string }} [opts]
 * @returns {Promise<{ ok: true, text: string } | { ok: false, error: string }>}
 */
export async function rewriteWithOllama(text, opts = {}) {
  const base = normalizeOllamaBase()
  const envModel = typeof import.meta.env.VITE_OLLAMA_MODEL === 'string' ? import.meta.env.VITE_OLLAMA_MODEL.trim() : ''
  const model = (opts.model && String(opts.model).trim()) || envModel || 'llama3.2'

  const slice = String(text ?? '').trim().slice(0, 12000)
  if (!slice) {
    return { ok: false, error: 'Texto vacío' }
  }

  const prompt =
    'Rewrite the following text more clearly and fluently, keeping the same language. ' +
    'Reply with only the rewritten text, no explanations or quotes:\n\n' +
    slice

  try {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    })

    if (!res.ok) {
      return { ok: false, error: `Ollama HTTP ${res.status}` }
    }

    const data = await res.json()
    const out = typeof data?.response === 'string' ? data.response.trim() : ''
    return { ok: true, text: out || slice }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

/**
 * Modelos ONNX (Transformers.js): carga perezosa vía `import()` para no bloquear el arranque.
 * `env.useBrowserCache` reutiliza descargas en el navegador (Cache API del cliente).
 */

import { detectLanguage } from './langdetect.js'

export const REWRITE_STYLES = [
  { id: 'profesional', label: 'Profesional', labelEs: 'Profesional', icon: '💼' },
  { id: 'directo', label: 'Directo', labelEs: 'Directo', icon: '⚡' },
  { id: 'amigable', label: 'Amigable', labelEs: 'Amigable', icon: '😊' },
  { id: 'formal', label: 'Formal', labelEs: 'Formal', icon: '📋' },
]

export const REWRITE_STYLE_PROMPTS = {
  profesional: {
    es: `<role>Editor de comunicación corporativa.</role>
<task>Mejora la redacción del texto dado aplicando estilo profesional corporativo.</task>
<constraints>
- CORRIGE errores de ortografía y puntuación
- APLICA tono formal profesional
- ELIMINA muletillas (básicamente, entonces, o sea, etc.)
- ELIMINA redundancias y repeticiones
- MEJORA estructura si es confusa
- NO añadas información nueva ni interpretada
- NO cambies nombres, fechas, ni datos del original
</constraints>
<output_format>Devuelve SOLO el texto mejorado. Sin comentarios.</output_format>`,
    en: `<role>Corporate communication editor.</role>
<task>Improve the wording of the given text applying professional corporate style.</task>
<constraints>
- FIX spelling and punctuation errors
- APPLY formal professional tone
- REMOVE filler words (basically, so, like, etc.)
- REMOVE redundancies and repetitions
- IMPROVE structure if confusing
- DO NOT add new or interpreted information
- DO NOT change names, dates, or data
</constraints>
<output_format>Return ONLY the improved text. No comments.</output_format>`,
  },
  directo: {
    es: `<role>Editor conciso.</role>
<task>Condensa el texto dado manteniendo exactamente el mismo mensaje.</task>
<constraints>
- CORRIGE ortografía y puntuación
- ELIMINA frases innecesarias
- COMBINA ideas relacionadas cuando sea posible
- MANTIENE solo la información esencial y el propósito
- NO añadas información nueva
- NO cambies nombres, fechas, ni datos
</constraints>
<output_format>Devuelve SOLO el texto condensado. Sin comentarios.</output_format>`,
    en: `<role>Concise editor.</role>
<task>Condense the given text keeping exactly the same message.</task>
<constraints>
- FIX spelling and punctuation
- REMOVE unnecessary phrases
- COMBINE related ideas when possible
- KEEP only essential information and purpose
- DO NOT add new information
- DO NOT change names, dates, or data
</constraints>
<output_format>Return ONLY the condensed text. No comments.</output_format>`,
  },
  amigable: {
    es: `<role>Editor de tono cercano.</role>
<task>Mejora la redacción del texto dado con lenguaje cálido y natural.</task>
<constraints>
- CORRIGE ortografía y puntuación
- USA lenguaje natural y humano (no administrativo)
- USA "tú" cuando sea apropiado
- SIMPLIFICA oraciones complejas
- NO añadas información nueva
- NO cambies nombres, fechas, ni datos
</constraints>
<output_format>Devuelve SOLO el texto mejorado. Sin comentarios.</output_format>`,
    en: `<role>Friendly tone editor.</role>
<task>Improve the wording of the given text with warm, natural language.</task>
<constraints>
- FIX spelling and punctuation
- USE natural human language (not administrative)
- USE "you" when appropriate
- SIMPLIFY complex sentences
- DO NOT add new information
- DO NOT change names, dates, or data
</constraints>
<output_format>Return ONLY the improved text. No comments.</output_format>`,
  },
formal: {
    es: `<task>
1. COPIA el texto original exactamente
2. VERIFICA que entiendes cada oración
3. REESCRIBE solo mejorándola en estilo formal profesional
4. VERIFICA que NO has añadido información nueva
</task>
<constraints>
- COPIA textual: nombres, fechas, datos del original
- CORRIGE ortografía y puntuación
- USA vocabulario formal estándar
- NO inventes reuniones, acciones, compromisos o información
- NO cambies el propósito del mensaje
</constraints>

ORIGINAL:
`,
    en: `<task>
1. COPY the original text exactly
2. VERIFY you understand each sentence
3. REWRITE only improving it in formal professional style
4. VERIFY you have NOT added new information
</task>
<constraints>
- COPY verbatim: names, dates, data from original
- FIX spelling and punctuation
- USE standard formal vocabulary
- DO NOT invent meetings, actions, commitments or information
- DO NOT change the message purpose
</constraints>

ORIGINAL:
`,
  },
  profesional: {
    es: `<task>
1. COPIA el texto original exactamente
2. VERIFICA que entiendes cada oración
3. REESCRIBE solo mejorándola en estilo profesional corporativo
4. VERIFICA que NO has añadido información nueva
</task>
<constraints>
- COPIA textual: nombres, fechas, datos del original
- CORRIGE ortografía, puntuación
- ELIMINA muletillas y redundancias
- NO inventes información
- NO cambies el propósito del mensaje
</constraints>

ORIGINAL:
`,
    en: `<task>
1. COPY the original text exactly
2. VERIFY you understand each sentence
3. REWRITE only improving it in professional corporate style
4. VERIFY you have NOT added new information
</task>
<constraints>
- COPY verbatim: names, dates, data from original
- FIX spelling, punctuation
- REMOVE filler words and redundancies
- DO NOT invent information
- DO NOT change the message purpose
</constraints>

ORIGINAL:
`,
  },
  directo: {
    es: `<task>
1. COPIA el texto original exactamente
2. VERIFICA que entiendes cada oración
3. CONDENSA solo eliminando lo innecesario
4. VERIFICA que NO has añadido información nueva
</task>
<constraints>
- COPIA textual: nombres, fechas, datos del original
- ELIMINA saludos, justificaciones innecesarias
- MANTIENE solo la información esencial y el objetivo
- NO inventes información
- NO cambies el propósito del mensaje
</constraints>

ORIGINAL:
`,
    en: `<task>
1. COPY the original text exactly
2. VERIFY you understand each sentence
3. CONDENSE only removing unnecessary content
4. VERIFY you have NOT added new information
</task>
<constraints>
- COPY verbatim: names, dates, data from original
- REMOVE greetings, unnecessary justifications
- KEEP only essential information and goal
- DO NOT invent information
- DO NOT change the message purpose
</constraints>

ORIGINAL:
`,
  },
  amigable: {
    es: `<task>
1. COPIA el texto original exactamente
2. VERIFICA que entiendes cada oración
3. REESCRIBE solo haciéndolo más cálido y natural
4. VERIFICA que NO has añadido información nueva
</task>
<constraints>
- COPIA textual: nombres, fechas, datos del original
- USA lenguaje humano y cercano
- USA "tú" cuando sea apropiado
- NO inventes información
- NO cambies el propósito del mensaje
</constraints>

ORIGINAL:
`,
    en: `<task>
1. COPY the original text exactly
2. VERIFY you understand each sentence
3. REWRITE only making it warmer and more natural
4. VERIFY you have NOT added new information
</task>
<constraints>
- COPY verbatim: names, dates, data from original
- USE human, approachable language
- USE "you" when appropriate
- DO NOT invent information
- DO NOT change the message purpose
</constraints>

ORIGINAL:
`,
  },
}

export const TF_REWRITE_STYLE_PROMPTS = {
  profesional: {
    es: `MEJORA: Corrige gramática y elimina redundancias. SIN inventar. SIN añadir información.

ORIGINAL: `,
    en: `IMPROVE: Fix grammar and remove redundancies. DO NOT invent. DO NOT add info.

ORIGINAL: `,
  },
  directo: {
    es: `CONDENA: Elimina lo innecesario. SIN inventar. SIN añadir info.

ORIGINAL: `,
    en: `CONDENSE: Remove unnecessary. DO NOT invent. DO NOT add info.

ORIGINAL: `,
  },
  amigable: {
    es: `MEJORA: Tono cercano y natural. SIN inventar. SIN cambiar mensaje.

ORIGINAL: `,
    en: `IMPROVE: Warm natural tone. DO NOT invent. DO NOT change message.

ORIGINAL: `,
  },
  formal: {
    es: `MEJORA: Lenguaje formal profesional. SIN inventar. SIN cambiar datos.

ORIGINAL: `,
    en: `IMPROVE: Professional formal language. DO NOT invent. DO NOT change data.

ORIGINAL: `,
  },
}

const SENTIMENT_MODEL = 'Xenova/bert-base-multilingual-uncased-sentiment'
const REWRITE_MODEL = 'Xenova/flan-t5-small'

let transformersModulePromise = null
let sentimentPipelinePromise = null
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

function noopProgress(info) {
  void info
}

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

export async function analyzeToneTransformers(text, opts = {}) {
  try {
    const slice = String(text ?? '').trim().slice(0, 512)
    if (!slice) return { ok: true, empty: true, details: [] }

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

function cleanOutput(text) {
  if (!text) return text
  text = text.replace(/^["'`]|(["'`])$/g, '').trim()
  const metaPatterns = [
    /^(Aquí está|Aquí tienes|Here is|Here's|El texto|Salida|Output|El resultado|Result).*?:/gi,
    /^(Reescritura|Rewritten).*?:/gi,
    /^(Texto|Texto reescrito|Edited text|Revised text).*?:/gi,
  ]
  for (const p of metaPatterns) {
    text = text.replace(p, '')
  }
  return text.trim()
}

export async function rewriteBasicTransformers(text, opts = {}) {
  try {
    const slice = String(text ?? '').trim().slice(0, 400)
    if (!slice) return { ok: false, error: 'Texto vacío' }

    const gen = await getText2TextPipeline(opts)
    const lang = detectLanguage(text)
    const isSpanish = lang.ok && lang.iso6393 === 'spa'
    const style = opts.style || 'profesional'
    const stylePrompts = TF_REWRITE_STYLE_PROMPTS[style] || TF_REWRITE_STYLE_PROMPTS.profesional
    const prefix = isSpanish ? stylePrompts.es : stylePrompts.en
    const input = prefix + slice
    const out = await gen(input, {
      max_new_tokens: 120,
      temperature: 0.2,
      do_sample: false,
    })

    const raw = Array.isArray(out) ? out[0]?.generated_text : out?.generated_text
    let result = typeof raw === 'string' ? raw : ''
    return { ok: true, text: cleanOutput(result) || slice }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

export async function rewriteWithTransformers(text, opts = {}) {
  return rewriteBasicTransformers(text, opts)
}

function normalizeOllamaBase() {
  const raw = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
  return String(raw).replace(/\/+$/, '')
}

export async function rewriteWithOllama(text, opts = {}) {
  const base = normalizeOllamaBase()
  const envModel = typeof import.meta.env.VITE_OLLAMA_MODEL === 'string' ? import.meta.env.VITE_OLLAMA_MODEL.trim() : ''
  const model = (opts.model && String(opts.model).trim()) || envModel || 'llama3.2'

  const slice = String(text ?? '').trim().slice(0, 12000)
  if (!slice) return { ok: false, error: 'Texto vacío' }

  const lang = detectLanguage(text)
  const isSpanish = lang.ok && lang.iso6393 === 'spa'
  const style = opts.style || 'profesional'
  const stylePrompts = REWRITE_STYLE_PROMPTS[style] || REWRITE_STYLE_PROMPTS.profesional
  const prompt = (isSpanish ? stylePrompts.es : stylePrompts.en) + slice

  try {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.1, num_predict: 500 } }),
    })

    if (!res.ok) return { ok: false, error: `Ollama HTTP ${res.status}` }

    const data = await res.json()
    const out = typeof data?.response === 'string' ? data.response.trim() : ''
    return { ok: true, text: cleanOutput(out) || slice }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
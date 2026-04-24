import { getIgnoredLtRuleIds } from './ltIgnoredRules.js'

const url = import.meta.env.VITE_LANGUAGETOOL_URL

/** Tiempo de espera recomendado antes de llamar a la API (público: 20 req/min). */
export const DEBOUNCE_MS = 800

/**
 * @typedef {{ from: number, to: number, category: 'spelling' | 'grammar' | 'style', message: string, replacements: string[], ruleId: string }} LtMatch
 */

/**
 * @param {unknown} raw
 * @returns {LtMatch[]}
 */
function normalizeMatches(raw) {
  if (!Array.isArray(raw)) return []
  /** @type {LtMatch[]} */
  const out = []
  for (const m of raw) {
    const offset = Number(m?.offset)
    const length = Number(m?.length)
    if (!Number.isFinite(offset) || !Number.isFinite(length) || length <= 0) continue
    const message = typeof m?.message === 'string' ? m.message : ''
    const reps = Array.isArray(m?.replacements)
      ? m.replacements.map((r) => (r && typeof r.value === 'string' ? r.value : '')).filter(Boolean)
      : []
    const ruleId = typeof m?.rule?.id === 'string' ? m.rule.id : ''
    out.push({
      from: offset,
      to: offset + length,
      category: mapCategory(m),
      message,
      replacements: reps,
      ruleId,
    })
  }
  return out
}

/**
 * @param {object} m
 * @returns {'spelling' | 'grammar' | 'style'}
 */
function mapCategory(m) {
  const cat = String(m?.rule?.category?.id || '').toUpperCase()
  const issue = String(m?.rule?.issueType || '').toLowerCase()

  if (issue === 'misspelling' || cat === 'TYPOS') return 'spelling'
  if (
    cat === 'STYLE' ||
    cat === 'TYPOGRAPHY' ||
    cat === 'REDUNDANCY' ||
    cat === 'PLAIN_ENGLISH' ||
    cat === 'CASING' ||
    issue === 'style'
  ) {
    return 'style'
  }
  return 'grammar'
}

/**
 * @param {string} text
 * @param {{ language?: string }} [opts]
 * @returns {Promise<{ ok: true, matches: LtMatch[] } | { ok: false, error: string }>}
 */
export async function checkText(text, opts = {}) {
  const base = url?.trim()
  if (!base) {
    return { ok: false, error: 'VITE_LANGUAGETOOL_URL no definida' }
  }

  const language = opts.language ?? 'auto'
  const body = new URLSearchParams()
  body.set('text', text)
  body.set('language', language)

  const ignored = getIgnoredLtRuleIds()
  if (ignored.length > 0) {
    body.set('disabledRules', ignored.join(','))
  }

  try {
    const res = await fetch(base, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      return { ok: false, error: `LanguageTool HTTP ${res.status}` }
    }

    const data = await res.json()
    const ignoredSet = new Set(getIgnoredLtRuleIds())
    const matches = normalizeMatches(data?.matches).filter((m) => !ignoredSet.has(m.ruleId))
    return { ok: true, matches }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

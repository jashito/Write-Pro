import sentiment from 'wink-sentiment'

/** Umbral en escala normalizada (-5…5) de wink-sentiment. */
const POS = 0.25
const NEG = -0.25

/**
 * @param {string} text
 * @returns {{ ok: true, label: 'positive' | 'negative' | 'neutral', labelEs: string, rawScore: number, normalizedScore: number } | { ok: false, error: string }}
 */
export function analyzeSentiment(text) {
  try {
    const t = String(text ?? '').trim()
    if (!t) {
      return {
        ok: true,
        label: 'neutral',
        labelEs: 'Neutral',
        rawScore: 0,
        normalizedScore: 0,
      }
    }

    const result = sentiment(t)
    const normalizedScore = Number(result.normalizedScore) || 0
    const rawScore = Number(result.score) || 0

    let label = 'neutral'
    if (normalizedScore > POS) label = 'positive'
    else if (normalizedScore < NEG) label = 'negative'

    const labelEs =
      label === 'positive' ? 'Positivo' : label === 'negative' ? 'Negativo' : 'Neutral'

    return { ok: true, label, labelEs, rawScore, normalizedScore }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

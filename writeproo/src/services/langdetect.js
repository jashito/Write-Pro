import { franc } from 'franc-min'

/**
 * ISO 639-3 → código `language` de LanguageTool.
 * Fuera de esta tabla se usa `auto` (detección en servidor).
 */
const ISO6393_TO_LANGUAGETOOL = {
  spa: 'es',
  eng: 'en',
}

/**
 * Detecta el idioma del texto con franc-min y devuelve el parámetro adecuado para LanguageTool.
 *
 * @param {string} text
 * @returns {{ ok: true, language: string, iso6393: string } | { ok: false, error: string }}
 */
export function detectLanguage(text) {
  try {
    const sample = String(text ?? '')
      .trim()
      .slice(0, 2048)

    if (sample.length === 0) {
      return { ok: true, language: 'auto', iso6393: 'und' }
    }

    const iso6393 = franc(sample)
    const language = ISO6393_TO_LANGUAGETOOL[iso6393] ?? 'auto'

    return { ok: true, language, iso6393 }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

import { StateEffect, StateField } from '@codemirror/state'
import { Decoration, EditorView } from '@codemirror/view'

/** Reemplaza los subrayados de LanguageTool por este conjunto de coincidencias. */
export const setLanguageToolMatches = StateEffect.define()

const markSpelling = Decoration.mark({ class: 'cm-lt-spelling', attributes: { 'data-lt': 'spelling' } })
const markGrammar = Decoration.mark({ class: 'cm-lt-grammar', attributes: { 'data-lt': 'grammar' } })
const markStyle = Decoration.mark({ class: 'cm-lt-style', attributes: { 'data-lt': 'style' } })

/**
 * @param {import('@codemirror/state').ChangeDesc} changes
 * @param {Array<{ from: number, to: number }>} matches
 */
function mapMatchesThroughChanges(matches, changes) {
  if (changes.empty) return matches
  const out = []
  for (const m of matches) {
    const from = changes.mapPos(m.from, -1)
    const to = changes.mapPos(m.to, 1)
    if (from < to) out.push({ ...m, from, to })
  }
  return out
}

/**
 * @param {Array<{ from: number, to: number, category: string }>} matches
 * @param {number} docLength
 */
function buildDecorations(matches, docLength) {
  const sorted = [...matches].sort((a, b) => a.from - b.from || a.to - b.to)
  /** @type {import('@codemirror/state').Range<Decoration>[]} */
  const ranges = []
  for (const m of sorted) {
    let from = Math.max(0, m.from)
    let to = Math.min(docLength, m.to)
    if (from >= to) continue
    const deco =
      m.category === 'spelling' ? markSpelling : m.category === 'style' ? markStyle : markGrammar
    ranges.push(deco.range(from, to))
  }
  return ranges.length > 0 ? Decoration.set(ranges, true) : Decoration.none
}

const ltDecorationField = StateField.define({
  create() {
    return Decoration.none
  },
  update(deco, tr) {
    deco = deco.map(tr.changes)
    for (const e of tr.effects) {
      if (e.is(setLanguageToolMatches)) {
        const list = Array.isArray(e.value) ? e.value : []
        deco = buildDecorations(list, tr.state.doc.length)
      }
    }
    return deco
  },
  provide: (f) => EditorView.decorations.from(f),
})

/** Coincidencias actuales de LanguageTool (posiciones mapeadas al documento). */
export const ltMatchesField = StateField.define({
  create() {
    return []
  },
  update(matches, tr) {
    for (const e of tr.effects) {
      if (e.is(setLanguageToolMatches)) {
        const list = Array.isArray(e.value) ? e.value : []
        return list.map((m) => ({ ...m }))
      }
    }
    if (!tr.changes.empty) return mapMatchesThroughChanges(matches, tr.changes)
    return matches
  },
})

function markTheme() {
  return EditorView.baseTheme({
    '.cm-lt-spelling': {
      textDecoration: 'underline wavy',
      textDecorationThickness: 'from-font',
      textUnderlineOffset: '2px',
      textDecorationColor: 'var(--color-error-spelling)',
    },
    '.cm-lt-grammar': {
      textDecoration: 'underline wavy',
      textDecorationThickness: 'from-font',
      textUnderlineOffset: '2px',
      textDecorationColor: 'var(--color-error-grammar)',
    },
    '.cm-lt-style': {
      textDecoration: 'underline wavy',
      textDecorationThickness: 'from-font',
      textUnderlineOffset: '2px',
      textDecorationColor: 'var(--color-error-style)',
    },
  })
}

/** Extensión CM6: pinta errores de LanguageTool (ortografía / gramática / estilo). */
export function languageToolDecorations() {
  return [ltDecorationField, ltMatchesField, markTheme()]
}

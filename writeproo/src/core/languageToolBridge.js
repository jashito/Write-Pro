import { ViewPlugin } from '@codemirror/view'
import { checkText, DEBOUNCE_MS } from '../services/languagetool.js'
import { detectLanguage } from '../services/langdetect.js'
import { setLanguageToolMatches } from '../editor/markers.js'

/**
 * Escucha cambios del documento, espera {@link DEBOUNCE_MS} y llama a LanguageTool.
 * También agenda una comprobación al crear la vista (texto inicial).
 */
export function createLanguageToolUpdateExtension() {
  return ViewPlugin.define(
    class LanguageToolSync {
      /** @param {import('@codemirror/view').EditorView} view */
      constructor(view) {
        this._view = view
        this._timeoutId = 0
        this._generation = 0
        this._schedule()
      }

      /** @param {import('@codemirror/view').ViewUpdate} update */
      update(update) {
        if (update.docChanged) this._schedule()
      }

      _schedule() {
        clearTimeout(this._timeoutId)
        const view = this._view
        const gen = ++this._generation

        this._timeoutId = setTimeout(async () => {
          if (gen !== this._generation || view.destroyed) return

          const text = view.state.doc.toString()
          const lang = detectLanguage(text)
          const language = lang.ok ? lang.language : 'auto'
          const result = await checkText(text, { language })

          if (gen !== this._generation || view.destroyed) return

          if (result.ok) {
            view.dispatch({
              effects: setLanguageToolMatches.of(result.matches),
            })
          } else {
            view.dispatch({ effects: setLanguageToolMatches.of([]) })
            console.warn('[LanguageTool]', result.error)
          }
        }, DEBOUNCE_MS)
      }

      destroy() {
        clearTimeout(this._timeoutId)
      }
    },
  )
}

import { ViewPlugin } from '@codemirror/view'
import { checkText, DEBOUNCE_MS } from '../services/languagetool.js'
import { detectLanguage } from '../services/langdetect.js'
import { setLanguageToolMatches } from '../editor/markers.js'
import { mountToast } from '../ui/toast.js'

let forceCheckFn = null

export function createLanguageToolUpdateExtension() {
  return ViewPlugin.fromClass(
    class {
      constructor(view) {
        this._view = view
        this._timeoutId = 0
        this._generation = 0
        forceCheckFn = (immediate = false) => this._doCheck(immediate)
        this._doCheck()
      }

      update(update) {
        if (update.docChanged) this._doCheck()
      }

      destroy() {
        clearTimeout(this._timeoutId)
        forceCheckFn = null
      }

      _doCheck(immediate = false) {
        clearTimeout(this._timeoutId)
        const view = this._view
        const gen = ++this._generation

        this._timeoutId = setTimeout(async () => {
          if (gen !== this._generation || view.destroyed) return

          const text = view.state.doc.toString()
          const manualLang = window.__writeproLang
          const detected = detectLanguage(text)
          const language =
            manualLang && manualLang !== 'auto' ? manualLang : detected.ok ? detected.language : 'auto'
          const result = await checkText(text, { language })

          if (gen !== this._generation || view.destroyed) return

          if (result.ok) {
            view.dispatch({ effects: setLanguageToolMatches.of(result.matches) })
          } else {
            view.dispatch({ effects: setLanguageToolMatches.of([]) })
            const toastRoot = document.querySelector('#toast-root')
            if (toastRoot) mountToast(toastRoot, 'error', 'LanguageTool: ' + result.error, 5000)
            else console.warn('[LanguageTool]', result.error)
          }
        }, immediate ? 0 : DEBOUNCE_MS)
      }
    },
  )
}

export function forceLanguageToolCheck() {
  if (typeof forceCheckFn === 'function') forceCheckFn(true)
}
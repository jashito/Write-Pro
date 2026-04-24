import { ViewPlugin } from '@codemirror/view'
import { ltMatchesField, setLanguageToolMatches } from '../editor/markers.js'
import { applySuggestionToEditorView } from '../core/diff.js'
import { addIgnoredLtRuleId } from '../services/ltIgnoredRules.js'

function matchAtPos(matches, pos) {
  return matches.find((m) => pos >= m.from && pos < m.to) ?? null
}

function targetIsLtMark(el) {
  return el instanceof Element && el.closest('.cm-lt-spelling, .cm-lt-grammar, .cm-lt-style')
}

export function createLtTooltipExtension() {
  return ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.view = view
        this.dialog = null
        this.activeMatch = null
        this._onEditorClick = this._onEditorClick.bind(this)
        view.dom.addEventListener('click', this._onEditorClick, true)
      }

      update(update) {
        if (!this.activeMatch || !update.docChanged) return
        const ch = update.changes
        const from = ch.mapPos(this.activeMatch.from, -1)
        const to = ch.mapPos(this.activeMatch.to, 1)
        if (from >= to) this.close()
        else this.activeMatch = { ...this.activeMatch, from, to }
      }

      destroy() {
        this.view.dom.removeEventListener('click', this._onEditorClick, true)
        this.close()
      }

      _onEditorClick(event) {
        if (!(event.target instanceof Node)) return
        if (this.dialog?.contains(event.target)) return
        if (!targetIsLtMark(event.target)) { this.close(); return }

        const pos = this.view.posAtCoords({ x: event.clientX, y: event.clientY })
        if (pos == null) return
        const matches = this.view.state.field(ltMatchesField)
        const match = matchAtPos(matches, pos)
        if (!match) return

        event.preventDefault()
        event.stopPropagation()
        this.openDialog(match)
      }

      openDialog(match) {
        this.close()
        this.activeMatch = { ...match }

        const overlay = document.createElement('div')
        overlay.className = 'dialog-overlay'
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) this.close()
        })

        const content = document.createElement('div')
        content.className = 'dialog-content'
        content.style.position = 'relative'
        content.innerHTML = `
          <button class="dialog-close" aria-label="Cerrar">×</button>
          <div class="dialog-header">
            <h3 class="dialog-title">Sugerencia de corrección</h3>
          </div>
          <p class="dialog-description">${match.message || 'Sin descripción disponible'}</p>
          <div class="lt-suggestions">
            ${this._buildSuggestionsHtml(match.replacements)}
          </div>
          <div class="dialog-footer">
            <button class="btn btn-ghost btn-sm" data-action="dismiss">Ignorar</button>
            <button class="btn btn-ghost btn-sm" data-action="ignore-always">Ignorar siempre</button>
            <button class="btn btn-primary btn-sm" data-action="accept" ${!match.replacements?.length ? 'disabled' : ''}>Aceptar primera</button>
          </div>
        `

        content.querySelector('.dialog-close')?.addEventListener('click', () => this.close())
        content.querySelector('[data-action="dismiss"]')?.addEventListener('click', () => this.close())
        content.querySelector('[data-action="ignore-always"]')?.addEventListener('click', () => this.ignoreAlways())
        content.querySelector('[data-action="accept"]')?.addEventListener('click', () => this.acceptFirst())

        document.body.appendChild(overlay)
        document.body.appendChild(content)
        this.dialog = content
        overlay.toastRef = overlay

        overlay.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.close()
        })
        content.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.close()
        })
      }

      _buildSuggestionsHtml(replacements) {
        if (!Array.isArray(replacements) || replacements.length === 0) {
          return '<p class="lt-no-suggestions">No hay sugerencias automáticas.</p>'
        }
        return '<div class="lt-suggestion-chips">' +
          replacements.map((r) =>
            `<button class="lt-suggestion-chip" data-suggestion="${r}" type="button">${r}</button>`
          ).join('') +
          '</div>'
      }

      acceptFirst() {
        const m = this.activeMatch
        const reps = m && Array.isArray(m.replacements) ? m.replacements : []
        if (!reps.length || typeof reps[0] !== 'string') return
        this.accept(reps[0])
      }

      accept(replacement) {
        const m = this.activeMatch
        if (!m || typeof m.from !== 'number' || typeof m.to !== 'number') return
        applySuggestionToEditorView(this.view, m.from, m.to, replacement)
        this.close()
      }

      ignoreAlways() {
        const m = this.activeMatch
        if (!m || typeof m.from !== 'number' || typeof m.to !== 'number') return
        const ruleId = typeof m.ruleId === 'string' ? m.ruleId : ''
        if (ruleId) addIgnoredLtRuleId(ruleId)
        const list = this.view.state.field(ltMatchesField)
        const next = ruleId ? list.filter((x) => x.ruleId !== ruleId) : list.filter((x) => !(x.from === m.from && x.to === m.to))
        this.view.dispatch({ effects: setLanguageToolMatches.of(next) })
        this.close()
      }

      close() {
        if (this.dialog) {
          const overlay = document.querySelector('.dialog-overlay')
          overlay?.remove()
          this.dialog.remove()
          this.dialog = null
        }
        this.activeMatch = null
      }
    },
  )
}
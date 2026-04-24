import { ViewPlugin } from '@codemirror/view'
import { ltMatchesField, setLanguageToolMatches } from '../editor/markers.js'
import { applySuggestionToEditorView } from '../core/diff.js'
import { addIgnoredLtRuleId } from '../services/ltIgnoredRules.js'

/**
 * @param {Array<{ from: number, to: number }>} matches
 * @param {number} pos
 */
function matchAtPos(matches, pos) {
  return matches.find((m) => pos >= m.from && pos < m.to) ?? null
}

/**
 * @param {EventTarget | null} el
 */
function targetIsLtMark(el) {
  return el instanceof Element && el.closest('.cm-lt-spelling, .cm-lt-grammar, .cm-lt-style')
}

/**
 * @param {HTMLElement} panel
 * @param {number} clientX
 * @param {number} clientY
 */
function positionPanel(panel, clientX, clientY) {
  const pad = 8
  const vw = window.innerWidth
  const vh = window.innerHeight
  panel.style.visibility = 'hidden'
  panel.style.left = '0'
  panel.style.top = '0'
  const rect = panel.getBoundingClientRect()
  let left = clientX + pad
  let top = clientY + pad
  if (left + rect.width > vw - pad) left = Math.max(pad, vw - rect.width - pad)
  if (top + rect.height > vh - pad) top = Math.max(pad, clientY - rect.height - pad)
  panel.style.left = `${left}px`
  panel.style.top = `${top}px`
  panel.style.visibility = ''
}

/** Tooltip de LanguageTool: clic en subrayado → sugerencias y acciones. */
export function createLtTooltipExtension() {
  return ViewPlugin.fromClass(
    class LtTooltip {
      /** @param {import('@codemirror/view').EditorView} view */
      constructor(view) {
        this.view = view
        /** @type {HTMLElement | null} */
        this.panel = null
        /** @type {(() => void) | null} */
        this.removeOutside = null
        /** @type {Record<string, unknown> | null} */
        this.activeMatch = null

        this._onEditorClick = this._onEditorClick.bind(this)
        this._boundPanelClick = (/** @type {MouseEvent} */ e) => this._onPanelClick(e)
        view.dom.addEventListener('click', this._onEditorClick, true)
      }

      /** @param {import('@codemirror/view').ViewUpdate} update */
      update(update) {
        if (!this.activeMatch || !update.docChanged) return
        const ch = update.changes
        const from = ch.mapPos(this.activeMatch.from, -1)
        const to = ch.mapPos(this.activeMatch.to, 1)
        if (from >= to) this.close()
        else {
          this.activeMatch = { ...this.activeMatch, from, to }
        }
      }

      destroy() {
        this.view.dom.removeEventListener('click', this._onEditorClick, true)
        this.close()
      }

      /** @param {MouseEvent} event */
      _onEditorClick(event) {
        if (!(event.target instanceof Node)) return
        if (this.panel?.contains(event.target)) return

        if (!targetIsLtMark(event.target)) {
          this.close()
          return
        }

        const pos = this.view.posAtCoords({ x: event.clientX, y: event.clientY })
        if (pos == null) return

        const matches = this.view.state.field(ltMatchesField)
        const match = matchAtPos(matches, pos)
        if (!match) return

        event.preventDefault()
        event.stopPropagation()
        this.openPanel(match, event.clientX, event.clientY)
      }

      /** @param {MouseEvent} event */
      _onPanelClick(event) {
        event.stopPropagation()
        const t = event.target
        if (!(t instanceof Element)) return

        const sugBtn = t.closest('button[data-lt-suggestion]')
        if (sugBtn instanceof HTMLButtonElement) {
          const value = sugBtn.getAttribute('data-lt-suggestion') ?? ''
          this.accept(value)
          return
        }

        const actionBtn = t.closest('button[data-lt-action]')
        if (!(actionBtn instanceof HTMLButtonElement) || !this.activeMatch) return

        const action = actionBtn.getAttribute('data-lt-action')
        if (action === 'dismiss') this.close()
        else if (action === 'accept') this.acceptFirst()
        else if (action === 'ignore-always') this.ignoreAlways()
      }

      /** @param {Record<string, unknown>} match */
      openPanel(match, clientX, clientY) {
        this.close()
        this.activeMatch = { ...match }

        const panel = document.createElement('div')
        panel.className = 'lt-tooltip'
        panel.setAttribute('role', 'dialog')
        panel.setAttribute('aria-label', 'Sugerencia de corrección')

        const msg = document.createElement('p')
        msg.className = 'lt-tooltip__message'
        msg.textContent = typeof match.message === 'string' && match.message ? match.message : 'Sin descripción'

        const sugWrap = document.createElement('div')
        sugWrap.className = 'lt-tooltip__suggestions'
        const reps = Array.isArray(match.replacements)
          ? /** @type {string[]} */ (match.replacements).filter((r) => typeof r === 'string')
          : []
        if (reps.length === 0) {
          const empty = document.createElement('p')
          empty.className = 'lt-tooltip__empty'
          empty.textContent = 'No hay sugerencias automáticas.'
          sugWrap.appendChild(empty)
        } else {
          for (const r of reps) {
            const b = document.createElement('button')
            b.type = 'button'
            b.className = 'lt-tooltip__chip'
            b.textContent = r
            b.setAttribute('data-lt-suggestion', r)
            sugWrap.appendChild(b)
          }
        }

        const actions = document.createElement('div')
        actions.className = 'lt-tooltip__actions'

        const btnAccept = document.createElement('button')
        btnAccept.type = 'button'
        btnAccept.className = 'lt-tooltip__btn lt-tooltip__btn--primary'
        btnAccept.setAttribute('data-lt-action', 'accept')
        btnAccept.textContent = 'Aceptar'
        btnAccept.disabled = reps.length === 0

        const btnDismiss = document.createElement('button')
        btnDismiss.type = 'button'
        btnDismiss.className = 'lt-tooltip__btn'
        btnDismiss.setAttribute('data-lt-action', 'dismiss')
        btnDismiss.textContent = 'Ignorar'

        const btnAlways = document.createElement('button')
        btnAlways.type = 'button'
        btnAlways.className = 'lt-tooltip__btn lt-tooltip__btn--ghost'
        btnAlways.setAttribute('data-lt-action', 'ignore-always')
        btnAlways.textContent = 'Ignorar siempre'

        actions.append(btnAccept, btnDismiss, btnAlways)
        panel.append(msg, sugWrap, actions)
        panel.addEventListener('click', this._boundPanelClick)

        document.body.appendChild(panel)
        panel.style.position = 'fixed'
        panel.style.zIndex = '9999'
        positionPanel(panel, clientX, clientY)

        this.panel = panel

        const onOutside = (ev) => {
          if (!(ev.target instanceof Node)) return
          if (this.panel?.contains(ev.target)) return
          if (this.view.dom.contains(ev.target)) return
          this.close()
        }
        document.addEventListener('pointerdown', onOutside, true)
        this.removeOutside = () => document.removeEventListener('pointerdown', onOutside, true)

        requestAnimationFrame(() => positionPanel(panel, clientX, clientY))
      }

      acceptFirst() {
        const m = this.activeMatch
        const reps = m && Array.isArray(m.replacements) ? m.replacements : []
        if (!reps.length || typeof reps[0] !== 'string') return
        this.accept(reps[0])
      }

      /** @param {string} replacement */
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
        const next = ruleId
          ? list.filter((x) => x.ruleId !== ruleId)
          : list.filter((x) => !(x.from === m.from && x.to === m.to))

        this.view.dispatch({ effects: setLanguageToolMatches.of(next) })
        this.close()
      }

      close() {
        this.removeOutside?.()
        this.removeOutside = null
        if (this.panel) {
          this.panel.removeEventListener('click', this._boundPanelClick)
          this.panel.remove()
        }
        this.panel = null
        this.activeMatch = null
      }
    },
  )
}

import { ViewPlugin } from '@codemirror/view'
import { analyzeSentiment } from '../services/sentiment.js'
import { analyzeToneTransformers, rewriteBasicTransformers, rewriteWithOllama, REWRITE_STYLES } from '../services/rewrite.js'
import { detectCapabilities, OLLAMA_PROBE_TIMEOUT_MS } from '../services/capabilities.js'

const DEBOUNCE_MS = 120
const TF_TONE_DEBOUNCE_MS = 450

/**
 * Panel lateral: tono (wink-sentiment) + puntuación normalizada.
 * @param {HTMLElement | null} host
 */
export function createSentimentSidepanelExtension(host) {
  if (!host) {
    return []
  }

  return [
    ViewPlugin.fromClass(
      class {
        constructor(view) {
          this._view = view
          this._host = host
          this._timeoutId = 0
          this._generation = 0
          this._tfTimeoutId = 0
          this._tfGeneration = 0
          this._tfToneActive = false
          this._tfBusy = false
          this._ollamaBusy = false
          this._ollamaModel = null

          this._root = document.createElement('div')
          this._root.className = 'sidepanel'
          this._root.innerHTML = `
            <h2 class="sidepanel__title">Tono del texto</h2>
            <p class="sidepanel__hint">Análisis local (inglés optimizado; orientativo en español).</p>
            <div class="sidepanel__tone-card" data-tone-card>
              <span class="sidepanel__tone-label" data-tone-label>—</span>
              <span class="sidepanel__tone-badge" data-tone-badge aria-hidden="true"></span>
            </div>
            <dl class="sidepanel__stats">
              <div class="sidepanel__stat">
                <dt>Puntuación normalizada</dt>
                <dd data-score-norm>0</dd>
              </div>
              <div class="sidepanel__stat">
                <dt>Puntuación bruta</dt>
                <dd data-score-raw>0</dd>
              </div>
</dl>

            <!-- <section class="sidepanel-tf" aria-label="Transformers.js">
              <h2 class="sidepanel__title">Transformers.js</h2>
              <p class="sidepanel__hint">Carga bajo demanda. Los modelos se guardan en la caché del navegador (no se re-descargan en cada visita).</p>
              <button type="button" class="btn btn-outline btn-sm" data-tf-enable>Tono avanzado (multilingüe)</button>
              <p class="sidepanel-tf__status" data-tf-status hidden aria-live="polite" aria-atomic="true"></p>
              <ol class="sidepanel-tf__labels" data-tf-labels hidden aria-label="Etiquetas de sentimiento" aria-live="polite"></ol>
              <div class="sidepanel__style-selector" data-tf-style-container hidden>
                <label class="label" for="tf-rewrite-style">Estilo:</label>
                <select id="tf-rewrite-style" class="select" data-tf-rewrite-style>
                  ${REWRITE_STYLES.map(s => `<option value="${s.id}">${s.labelEs}</option>`).join('')}
                </select>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-tf-rewrite disabled>Reescritura (Flan-T5)</button>
              <label class="sidepanel-tf__out-label">
                <span>Salida de reescritura</span>
                <textarea class="textarea" data-tf-out readonly rows="5" placeholder="Pulsa «Reescritura (Flan-T5)» para generar…"></textarea>
              </label>
            </section> -->

            <section class="sidepanel-ollama" aria-label="Ollama">
              <h2 class="sidepanel__title">Ollama</h2>
              <p class="sidepanel__hint" data-ollama-hint>Comprobando servidor local…</p>
              <div class="sidepanel__style-selector" data-style-container hidden>
                <label class="sidepanel__style-label" for="rewrite-style">Estilo:</label>
                <select id="rewrite-style" class="select" data-rewrite-style>
                  ${REWRITE_STYLES.map(s => `<option value="${s.id}">${s.labelEs}</option>`).join('')}
                </select>
              </div>
              <button type="button" class="btn btn-primary btn-sm" data-ollama-rewrite hidden disabled>Reescribir con Ollama</button>
              <p class="sidepanel-tf__status" data-ollama-status hidden></p>
              <label class="sidepanel-tf__out-label">
                <span>Salida Ollama</span>
                <textarea class="textarea" data-ollama-out readonly rows="4" placeholder="Disponible si Ollama responde en la URL configurada."></textarea>
              </label>
            </section>
          `
          host.appendChild(this._root)

          this._elLabel = this._root.querySelector('[data-tone-label]')
          this._elBadge = this._root.querySelector('[data-tone-badge]')
          this._elCard = this._root.querySelector('[data-tone-card]')
          this._elNorm = this._root.querySelector('[data-score-norm]')
          this._elRaw = this._root.querySelector('[data-score-raw]')

          this._btnTfEnable = null
          this._btnTfRewrite = null
          this._elTfStatus = null
          this._elTfLabels = null
          this._elTfOut = null
          this._elTfStyleContainer = null
          this._elTfStyleSelect = null
          this._tfSelectedStyle = 'profesional'
          this._tfToneActive = false
          this._tfBusy = false

          this._elOllamaHint = this._root.querySelector('[data-ollama-hint]')
          this._elStyleContainer = this._root.querySelector('[data-style-container]')
          this._elStyleSelect = this._root.querySelector('[data-rewrite-style]')
          this._btnOllamaRewrite = this._root.querySelector('[data-ollama-rewrite]')
          this._elOllamaStatus = this._root.querySelector('[data-ollama-status]')
          this._elOllamaOut = this._root.querySelector('[data-ollama-out]')
          this._selectedStyle = 'profesional'

          this._btnOllamaRewrite.addEventListener('click', () => this._onOllamaRewrite())
          this._elStyleSelect?.addEventListener('change', (e) => {
            if (e.target instanceof HTMLSelectElement) this._selectedStyle = e.target.value
          })

          this._flush()
          void this._probeOllama()
        }

        update(update) {
          if (update.docChanged) {
            this._schedule()
          }
        }

        destroy() {
          clearTimeout(this._timeoutId)
          this._root.remove()
        }

        _schedule() {
          clearTimeout(this._timeoutId)
          const view = this._view
          const gen = ++this._generation
          this._timeoutId = setTimeout(() => {
            if (gen !== this._generation || view.destroyed) return
            this._flush()
          }, DEBOUNCE_MS)
        }

        _scheduleTfTone() {
          clearTimeout(this._tfTimeoutId)
          const view = this._view
          const gen = ++this._tfGeneration
          this._tfTimeoutId = setTimeout(() => {
            if (gen !== this._tfGeneration || view.destroyed) return
            void this._runTfTone()
          }, TF_TONE_DEBOUNCE_MS)
        }

        _flush() {
          const text = this._view.state.doc.toString()
          const r = analyzeSentiment(text)
          if (!r.ok) {
            this._elLabel.textContent = '—'
            this._elBadge.textContent = ''
            this._elCard.dataset.tone = 'unknown'
            this._elNorm.textContent = '—'
            this._elRaw.textContent = '—'
            return
          }

          this._elLabel.textContent = r.labelEs
          this._elBadge.textContent = r.label === 'positive' ? '↑' : r.label === 'negative' ? '↓' : '○'
          this._elCard.dataset.tone = r.label
          this._elNorm.textContent = formatScore(r.normalizedScore)
          this._elRaw.textContent = formatScore(r.rawScore)
        }

        async _probeOllama() {
          const cap = await detectCapabilities()
          if (!cap.ok) {
            this._elOllamaHint.textContent = cap.error || 'No se pudo comprobar Ollama.'
            return
          }
          if (cap.ollama) {
            this._ollamaModel = cap.defaultModel
            this._elOllamaHint.textContent = `Servidor en ${cap.ollamaUrl}${cap.defaultModel ? ` · modelo: ${cap.defaultModel}` : ''}`
            this._btnOllamaRewrite.hidden = false
            this._btnOllamaRewrite.disabled = false
            if (this._elStyleContainer) this._elStyleContainer.hidden = false
          } else {
            this._elOllamaHint.textContent = `No hay respuesta en ${cap.ollamaUrl} (timeout ${OLLAMA_PROBE_TIMEOUT_MS} ms). Arranca Ollama o revisa VITE_OLLAMA_URL.`
          }
        }

        async _onTfEnable() {
          if (this._tfBusy) return
          this._tfBusy = true
          this._btnTfEnable.disabled = true
          this._btnTfRewrite.disabled = true
          this._elTfStatus.hidden = false
          this._elTfStatus.textContent = 'Preparando biblioteca…'

          try {
            const text = this._view.state.doc.toString()
            const r = await analyzeToneTransformers(text, {
              onProgress: (info) => {
                const o = info && typeof info === 'object' ? info : {}
                const bit = o.file ? String(o.file) : o.status ? String(o.status) : ''
                this._elTfStatus.textContent = bit ? `Descarga: ${bit}` : 'Descargando modelo…'
              },
            })

            if (!r.ok) {
              this._elTfStatus.textContent = r.error
              this._elTfLabels.hidden = true
              this._btnTfEnable.disabled = false
              this._tfBusy = false
              return
            }

            this._tfToneActive = true
            this._renderTfLabels(r.details, Boolean(r.empty))
            this._elTfStatus.hidden = true
            this._btnTfRewrite.disabled = false
            if (this._elTfStyleContainer) this._elTfStyleContainer.hidden = false
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            this._elTfStatus.textContent = msg
            this._elTfLabels.hidden = true
            this._btnTfEnable.disabled = false
          } finally {
            this._tfBusy = false
            if (this._tfToneActive) this._btnTfEnable.disabled = false
          }
        }

        async _runTfTone() {
          if (!this._tfToneActive || this._tfBusy) return
          this._tfBusy = true
          try {
            const text = this._view.state.doc.toString()
            const r = await analyzeToneTransformers(text)
            if (r.ok) this._renderTfLabels(r.details, Boolean(r.empty))
          } catch { /* noop */ }
          finally {
            this._tfBusy = false
          }
        }

        _renderTfLabels(details, empty) {
          this._elTfLabels.innerHTML = ''
          if (empty || !details.length) {
            this._elTfLabels.hidden = false
            const li = document.createElement('li')
            li.textContent = 'Sin texto suficiente para el modelo.'
            this._elTfLabels.appendChild(li)
            return
          }
          this._elTfLabels.hidden = false
          for (const d of details) {
            const li = document.createElement('li')
            li.textContent = `${d.label} — ${(d.score * 100).toFixed(1)}%`
            this._elTfLabels.appendChild(li)
          }
        }

        async _onTfRewrite() {
          if (this._tfBusy) return
          this._tfBusy = true
          this._btnTfRewrite.disabled = true
          this._elTfStatus.hidden = false
          this._elTfStatus.textContent = 'Generando reescritura…'

          try {
            const text = this._view.state.doc.toString()
            const r = await rewriteBasicTransformers(text, {
              onProgress: (info) => {
                const o = info && typeof info === 'object' ? info : {}
                if (o.file) this._elTfStatus.textContent = `Descarga: ${o.file}`
              },
              style: this._tfSelectedStyle,
            })

            if (!r.ok) {
              this._elTfStatus.textContent = r.error
              this._elTfStatus.hidden = false
              return
            }

            this._elTfOut.value = r.text
            this._elTfStatus.hidden = true
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            this._elTfStatus.textContent = msg
            this._elTfStatus.hidden = false
          } finally {
            this._tfBusy = false
            this._btnTfRewrite.disabled = false
          }
        }

        async _onOllamaRewrite() {
          if (this._ollamaBusy || this._btnOllamaRewrite.disabled) return
          this._ollamaBusy = true
          this._btnOllamaRewrite.disabled = true
          this._elOllamaStatus.hidden = false
          this._elOllamaStatus.textContent = 'Generando con Ollama…'

          try {
            const text = this._view.state.doc.toString()
            const r = await rewriteWithOllama(text, { model: this._ollamaModel || undefined, style: this._selectedStyle })

            if (!r.ok) {
              this._elOllamaStatus.textContent = r.error
              this._elOllamaStatus.hidden = false
              return
            }

            this._elOllamaOut.value = r.text
            this._elOllamaStatus.hidden = true
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            this._elOllamaStatus.textContent = msg
            this._elOllamaStatus.hidden = false
          } finally {
            this._ollamaBusy = false
            this._btnOllamaRewrite.disabled = false
          }
        }
      },
      { eventHandlers: { click: (e) => e.stopPropagation() } },
    ),
  ]
}

/**
 * @param {number} n
 */
function formatScore(n) {
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(n % 1 === 0 ? 0 : 2)
}

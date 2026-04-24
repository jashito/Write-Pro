import { detectCapabilities } from '../services/capabilities.js'

/**
 * Barra inferior: un indicador por motor, actualizado con {@link detectCapabilities}.
 *
 * @param {HTMLElement | null} host
 * @returns {() => void} Desmonta listeners (p. ej. tests o HMR).
 */
export function mountStatusBar(host) {
  if (!host) {
    return () => {}
  }

  host.innerHTML = `
    <div class="statusbar" role="region" aria-label="Estado de motores">
      <span class="statusbar__title">Motores</span>
      <ul class="statusbar__list" role="list">
        <li class="statusbar__pill" data-pill="languagetool" role="listitem">
          <span class="statusbar__dot" aria-hidden="true"></span>
          <span class="statusbar__name">LanguageTool</span>
          <span class="statusbar__detail" data-detail></span>
        </li>
        <li class="statusbar__pill" data-pill="ollama" role="listitem">
          <span class="statusbar__dot" aria-hidden="true"></span>
          <span class="statusbar__name">Ollama</span>
          <span class="statusbar__detail" data-detail></span>
        </li>
        <li class="statusbar__pill" data-pill="transformers" role="listitem">
          <span class="statusbar__dot" aria-hidden="true"></span>
          <span class="statusbar__name">Transformers.js</span>
          <span class="statusbar__detail" data-detail></span>
        </li>
        <li class="statusbar__pill" data-pill="local" role="listitem">
          <span class="statusbar__dot" aria-hidden="true"></span>
          <span class="statusbar__name">Local</span>
          <span class="statusbar__detail" data-detail></span>
        </li>
      </ul>
    </div>
  `

  const pillLt = host.querySelector('[data-pill="languagetool"]')
  const pillOllama = host.querySelector('[data-pill="ollama"]')
  const pillTf = host.querySelector('[data-pill="transformers"]')
  const pillLocal = host.querySelector('[data-pill="local"]')

  function setPill(/** @type {Element | null} */ el, status, detail) {
    if (!(el instanceof HTMLElement)) return
    el.dataset.status = status
    const d = el.querySelector('[data-detail]')
    if (d) d.textContent = detail
  }

  async function refresh() {
    const cap = await detectCapabilities()
    if (!cap.ok) {
      setPill(pillLt, 'off', cap.error || '—')
      setPill(pillOllama, 'off', '—')
      setPill(pillTf, 'warn', '—')
      setPill(pillLocal, 'ok', 'franc / wink')
      return
    }

    setPill(
      pillLt,
      cap.languageToolConfigured ? 'ok' : 'off',
      cap.languageToolConfigured ? 'URL configurada' : 'Falta VITE_LANGUAGETOOL_URL',
    )

    setPill(
      pillOllama,
      cap.ollama ? 'ok' : 'off',
      cap.ollama ? `En ${cap.ollamaUrl}` : `Sin respuesta (${cap.ollamaUrl})`,
    )

    setPill(pillTf, 'warn', cap.transformers === 'lazy' ? 'Carga al usar' : String(cap.transformers))

    setPill(pillLocal, 'ok', 'franc-min · wink-sentiment')
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible') void refresh()
  }

  void refresh()
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    document.removeEventListener('visibilitychange', onVisibility)
    host.innerHTML = ''
  }
}

/** @deprecated Usa `mountStatusBar` */
export function initStatusbar(host) {
  return mountStatusBar(host ?? null)
}

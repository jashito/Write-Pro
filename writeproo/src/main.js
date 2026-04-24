import './styles/main.css'
import { createEditor } from './editor/index.js'
import { createOrchestrator } from './core/orchestrator.js'
import { createLanguageToolUpdateExtension, forceLanguageToolCheck } from './core/languageToolBridge.js'
import { createLtTooltipExtension } from './ui/tooltip.js'
import { createSentimentSidepanelExtension } from './ui/sidepanel.js'
import { mountStatusBar } from './ui/statusbar.js'
import { mountToast } from './ui/toast.js'

const root = document.querySelector('#app')
if (root) {
  root.innerHTML = `
    <header class="app-header" role="banner">
      <div class="app-header__left">
        <h1 class="app-title">WritePro</h1>
        <p class="app-tagline">Corrector de ortografía, gramática y estilo (ES/EN)</p>
      </div>
      <div class="app-header__right">
        <label class="app-header__lang-label" for="lang-select">Idioma:</label>
        <select id="lang-select" class="app-header__lang-select" aria-label="Selector de idioma">
          <option value="auto">Auto</option>
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </div>
    </header>
    <div class="app-shell">
      <div id="editor" class="editor-host" aria-label="Editor de texto"></div>
      <aside class="sidepanel-host" aria-label="Panel lateral"></aside>
    </div>
    <footer class="statusbar-root" aria-label="Estado de motores"></footer>
  `

  const toastRoot = document.createElement('div')
  toastRoot.id = 'toast-root'
  toastRoot.setAttribute('aria-live', 'polite')
  toastRoot.setAttribute('aria-atomic', 'true')
  root.appendChild(toastRoot)

  const langSelect = document.querySelector('#lang-select')
  window.__writeproLang = langSelect instanceof HTMLSelectElement ? langSelect.value : 'auto'
  langSelect?.addEventListener('change', (e) => {
    if (e.target instanceof HTMLSelectElement) {
      window.__writeproLang = e.target.value
      forceLanguageToolCheck()
    }
  })

  const host = document.querySelector('#editor')
  const sideHost = document.querySelector('.sidepanel-host')
  const editor = createEditor(host, {
    extensions: [
      createLanguageToolUpdateExtension(),
      createLtTooltipExtension(),
      ...createSentimentSidepanelExtension(sideHost),
    ],
  })
  if (!editor.ok) {
    mountToast(document.querySelector('#toast-root'), 'error', 'Error al inicializar el editor: ' + editor.error)
  }

  const orchestrator = createOrchestrator({
    editor: editor.ok ? editor : null,
  })
  orchestrator.start()

  const statusRoot = document.querySelector('.statusbar-root')
  mountStatusBar(statusRoot instanceof HTMLElement ? statusRoot : null)
}

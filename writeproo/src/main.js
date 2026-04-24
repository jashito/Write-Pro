import './styles/main.css'
import { createEditor } from './editor/index.js'
import { createOrchestrator } from './core/orchestrator.js'
import { createLanguageToolUpdateExtension } from './core/languageToolBridge.js'
import { createLtTooltipExtension } from './ui/tooltip.js'
import { createSentimentSidepanelExtension } from './ui/sidepanel.js'
import { mountStatusBar } from './ui/statusbar.js'

const root = document.querySelector('#app')
if (root) {
  root.innerHTML = `
    <header class="app-header" role="banner">
      <h1 class="app-title">WritePro</h1>
      <p class="app-tagline">Corrector de ortografía, gramática y estilo (ES/EN)</p>
    </header>
    <div class="app-shell">
      <div id="editor" class="editor-host" aria-label="Editor de texto"></div>
      <aside class="sidepanel-host" aria-label="Panel lateral"></aside>
    </div>
    <footer class="statusbar-root" aria-label="Estado de motores"></footer>
  `

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
    console.error(editor.error)
  }

  const orchestrator = createOrchestrator({
    editor: editor.ok ? editor : null,
  })
  orchestrator.start()

  const statusRoot = document.querySelector('.statusbar-root')
  mountStatusBar(statusRoot instanceof HTMLElement ? statusRoot : null)
}

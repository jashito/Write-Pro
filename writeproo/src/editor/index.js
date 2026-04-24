import { EditorState } from '@codemirror/state'
import { EditorView, highlightActiveLine, highlightActiveLineGutter, lineNumbers } from '@codemirror/view'
import { minimalSetup } from 'codemirror'
import { languageToolDecorations } from './markers.js'

const STORAGE_KEY = 'writepro-doc'

export function loadSavedDoc() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
  } catch { /* empty */ }
  return null
}

export function saveDoc(text) {
  try {
    localStorage.setItem(STORAGE_KEY, text)
  } catch { /* quota exceeded or private mode */ }
}

const defaultDoc =
  'Escribe aquí tu texto en español o inglés.\n\nWritePro — corrector en desarrollo.'

function editorTheme() {
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: '15px',
      },
      '.cm-editor': {
        height: '100%',
        backgroundColor: 'var(--card)',
        borderRadius: '0 0 0 var(--radius)',
      },
      '.cm-scroller': {
        fontFamily: 'inherit',
        lineHeight: '1.65',
      },
      '.cm-content': {
        caretColor: 'var(--foreground)',
        paddingBlock: '0.75rem',
        paddingInline: '0.25rem 1rem',
        minHeight: '100%',
      },
      '.cm-line': {
        paddingInline: '2px 4px',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--foreground)',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': {
        backgroundColor: 'color-mix(in oklch, var(--color-error-style) 22%, transparent)',
      },
      '.cm-gutters': {
        backgroundColor: 'color-mix(in oklch, var(--background) 88%, transparent)',
        borderRight: '1px solid var(--border)',
        color: 'color-mix(in oklch, var(--foreground) 50%, transparent)',
        minHeight: '100%',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'color-mix(in oklch, var(--foreground) 6%, transparent)',
      },
      '.cm-activeLine': {
        backgroundColor: 'color-mix(in oklch, var(--foreground) 4%, transparent)',
      },
    },
    { dark: false },
  )
}

/**
 * @param {HTMLElement | null} parent
 * @param {{ doc?: string, extensions?: import('@codemirror/state').Extension[] }} [options]
 * @returns {{ ok: true, view: import('@codemirror/view').EditorView, destroy: () => void } | { ok: false, error: string }}
 */
export function createEditor(parent, options = {}) {
  if (!parent) {
    return { ok: false, error: 'contenedor del editor no encontrado' }
  }

  const saved = loadSavedDoc()
  const doc = options.doc ?? saved ?? defaultDoc

  const state = EditorState.create({
    doc,
    extensions: [
      minimalSetup,
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      editorTheme(),
      ...languageToolDecorations(),
      ...(options.extensions ?? []),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) saveDoc(update.state.doc.toString())
      }),
    ],
  })

  const view = new EditorView({
    state,
    parent,
  })

  return {
    ok: true,
    view,
    destroy() {
      view.destroy()
    },
  }
}

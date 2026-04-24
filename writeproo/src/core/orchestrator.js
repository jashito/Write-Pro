/**
 * @param {{ editor?: { view: import('@codemirror/view').EditorView, destroy: () => void } | null }} [ctx]
 */
export function createOrchestrator(ctx = {}) {
  return {
    start() {
      void ctx.editor
    },
    stop() {
      ctx.editor?.destroy()
    },
  }
}

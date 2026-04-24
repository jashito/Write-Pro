import { EditorSelection } from '@codemirror/state'
import diff_match_patch from 'diff-match-patch'

const dmp = new diff_match_patch()

export function applySuggestionPatch(oldText, newText) {
  const patches = dmp.patch_make(oldText, newText)
  const [result] = dmp.patch_apply(patches, oldText)
  return result
}

/**
 * Sustituye el rango `[from, to)` usando diff-match-patch entre el fragmento actual y `replacement`.
 * @param {import('@codemirror/view').EditorView} view
 * @param {number} from
 * @param {number} to
 * @param {string} replacement
 */
export function applySuggestionToEditorView(view, from, to, replacement) {
  const slice = view.state.doc.sliceString(from, to)
  const insert = applySuggestionPatch(slice, replacement)
  const cursor = from + insert.length
  view.dispatch({
    changes: { from, to, insert },
    selection: EditorSelection.single(cursor),
    scrollIntoView: true,
    userEvent: 'languageTool.accept',
  })
}

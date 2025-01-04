'use client'

import { Editor } from '@tiptap/core'
import { EditorContent, JSONContent, useEditor } from '@tiptap/react'
import { diffJson } from 'diff'
import { ForwardedRef, forwardRef, use, useCallback, useImperativeHandle, useState } from 'react'

import logger from '@/util/logger'

import BubbleMenu from './BubbleMenu'
import { TiptapExtension } from './extensions'

export type BlockEditorWithExtensionsRef = { saveContent: () => Promise<void> }

export interface Props {
  className?: string
  content?: JSONContent
  extensionsPromise: Promise<TiptapExtension[]>
  /**
   * If `true`, the editor will not automatically focus on the content.
   * @default false
   */
  manualFocus?: boolean
  onChange?: (
    content: JSONContent,
    meta: { wordCount: number },
    textContent: string,
    firstNodeText?: string
  ) => Promise<void>

  onFocus?: (editor: Editor) => void

  /**
   * @default false
   */
  readOnly?: boolean
}

function BlockEditorWithExtensions(
  { onChange, onFocus, content, className, extensionsPromise, readOnly = false, manualFocus = false }: Props,
  ref: ForwardedRef<BlockEditorWithExtensionsRef>
) {
  const extensions = use(extensionsPromise)

  const editor = useEditor({
    content,
    extensions,
    editable: !readOnly,
    immediatelyRender: false, // For server-side rendering
    autofocus: !manualFocus,
    onFocus: onFocus ? ({ editor }) => onFocus(editor) : undefined,
  })
  const [lastContent, setLastContent] = useState(content ?? {})

  const saveContent = useCallback(async () => {
    if (!editor) return

    const currentContent = editor.getJSON()
    const delta = diffJson(lastContent, currentContent)
    const changed = delta.some((change) => change.added || change.removed)

    if (changed) {
      const wordCount = editor.storage.characterCount.words()
      const firstNodeText = editor.state.doc.nodeAt(0)?.textContent

      await onChange?.(editor.getJSON(), { wordCount }, editor.getText(), firstNodeText)
      setLastContent(currentContent)
    } else {
      logger.debug('No changes to save')
    }
  }, [editor, lastContent, onChange])

  useImperativeHandle(ref, () => ({ saveContent }), [saveContent])

  return (
    <div>
      <EditorContent className={className} editor={editor} />
      {editor?.isEditable ? <BubbleMenu editor={editor} /> : null}
    </div>
  )
}

export default forwardRef(BlockEditorWithExtensions)

import { BubbleMenu as TiptapBubbleMenu, Editor } from '@tiptap/react'
import clsx from 'clsx'

import TextItems from './TextItems'

interface Props {
  editor: Editor
}

export default function BubbleMenu({ editor }: Props) {
  const selection = editor.state.selection
  // @ts-expect-error Tiptap types are not up-to-date, apparently
  const selectedNode = selection.node
  const showMenu =
    selection &&
    !selection.empty &&
    ['plot', 'filter', 'dataTable', 'datasetMetric', 'decision'].includes(selectedNode?.type.name)

  return (
    <TiptapBubbleMenu
      className={clsx('gap-0.5 rounded-md bg-gray-900 p-1 text-white shadow-sm flex-x-center', {
        '!hidden': showMenu,
      })}
      editor={editor}
      tippyOptions={{
        maxWidth: 550,
      }}
    >
      <TextItems editor={editor} />
    </TiptapBubbleMenu>
  )
}

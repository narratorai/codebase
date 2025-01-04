import { Editor } from '@tiptap/react'

import BoldMenuItem from './items/BoldMenuItem'
import BulletListMenuItem from './items/BulletListMenuItem'
import CodeMenuItem from './items/CodeMenuItem'
import HeadingMenuItem from './items/HeadingMenuItem'
import HighlightMenuItem from './items/HighlightMenuItem'
import ItalicMenuItem from './items/ItalicMenuItem'
import OrderedListMenuItem from './items/OrderedListMenuItem'
import ParagraphMenuItem from './items/ParagraphMenuItem'
import StrikethroughMenuItem from './items/StrikethroughMenuItem'
import SuperscriptMenuItem from './items/SuperscriptMenuItem'
import TextAlignMenuItem from './items/TextAlignMenuItem'
import TextColorMenuItem from './items/TextColorMenuItem'
import UnderlineMenuItem from './items/UnderlineMenuItem'

interface Props {
  editor: Editor
}

export default function TextItems({ editor }: Props) {
  return (
    <>
      <BoldMenuItem editor={editor} />
      <ItalicMenuItem editor={editor} />
      <UnderlineMenuItem editor={editor} />
      <StrikethroughMenuItem editor={editor} />
      <SuperscriptMenuItem editor={editor} />
      <CodeMenuItem editor={editor} />
      <div className="inline-block h-4 border-l border-gray-1000" />
      <ParagraphMenuItem editor={editor} />
      <HeadingMenuItem editor={editor} level={1} />
      <HeadingMenuItem editor={editor} level={2} />
      <HeadingMenuItem editor={editor} level={3} />
      <div className="inline-block h-4 border-l border-gray-1000" />
      <TextAlignMenuItem alignment="left" editor={editor} />
      <TextAlignMenuItem alignment="center" editor={editor} />
      <OrderedListMenuItem editor={editor} />
      <BulletListMenuItem editor={editor} />
      <div className="inline-block h-4 border-l border-gray-1000" />
      <TextColorMenuItem editor={editor} />
      <HighlightMenuItem editor={editor} />
    </>
  )
}

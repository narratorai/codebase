import { Node as ProsemirrorNode } from '@tiptap/pm/model'
import { RiPaletteLine } from 'react-icons/ri'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/shared/Popover'

import ColorButton from '../../BubbleMenu/items/ColorButton'
import { textHighlightPalette } from '../../BubbleMenu/items/colors'

interface Props {
  node: ProsemirrorNode
  updateAttributes: (attrs: Record<string, unknown>) => void
}

export default function EditCalloutMenu({ node, updateAttributes }: Props) {
  const { attrs } = node

  const handleBackgroundColorChange = (color: string) => {
    updateAttributes({ backgroundColor: color })
  }

  const toggleHideIcon = () => {
    const hideIcon = !attrs.hideIcon
    updateAttributes({ hideIcon })
  }

  return (
    <div className="rounded-md bg-gray-900 p-1 text-white shadow-sm flex-x-center">
      <button
        className="gap-0.5 rounded p-1.5 text-xs font-medium text-gray-100 flex-x-center hover:bg-gray-600"
        onClick={toggleHideIcon}
      >
        {attrs.hideIcon ? 'Show emoji' : 'Hide emoji'}
      </button>

      <Popover>
        <PopoverTrigger className="gap-0.5 rounded p-1.5 text-xs font-medium text-gray-100 flex-x-center hover:bg-gray-600">
          <RiPaletteLine className="size-4" />
        </PopoverTrigger>

        <PopoverContent className="z-50 rounded-md bg-white p-2 shadow-md" side="bottom" sideOffset={6}>
          <div className="grid grid-cols-4 gap-2">
            {textHighlightPalette.map((color) => (
              <ColorButton color={color} key={color} onClick={() => handleBackgroundColorChange(color)} />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

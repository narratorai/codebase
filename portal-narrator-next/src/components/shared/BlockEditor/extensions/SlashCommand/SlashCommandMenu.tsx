import { Editor, Range } from '@tiptap/react'
import { groupBy } from 'lodash'
import { forwardRef, useImperativeHandle } from 'react'
import { useStateList } from 'react-use'

import { SlashCommandItem } from './items'
import SlashCommandMenuCategory from './SlashCommandMenuCategory'

export interface Props {
  editor: Editor
  items: SlashCommandItem[]
  range: Range
}

export type Ref = {
  onKeyDown: (args: { event: KeyboardEvent }) => boolean
}

const SlashCommandMenu = forwardRef<Ref, Props>(function SlashCommandMenu({ items, editor, range }: Props, ref) {
  const { currentIndex, prev, next } = useStateList(items)

  const groupedItems = groupBy(items, 'category')
  const groupOffsets = Object.entries(groupedItems).reduce(
    (acc, [category, groupItems], index) => {
      acc[category] = groupItems.length + (index > 0 ? acc[Object.entries(groupedItems)[index - 1][0]] : 0)
      return acc
    },
    {} as Record<string, number>
  )

  const runItem = (index: number) => {
    const item = items[index]
    item.command({ editor, range })
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        prev()
        return true
      }

      if (event.key === 'ArrowDown') {
        next()
        return true
      }

      if (event.key === 'Enter') {
        runItem(currentIndex)
        return true
      }

      return false
    },
  }))

  return (
    <div className="max-h-96 w-60 overflow-scroll rounded-lg bg-white shadow-xl bordered-gray-100">
      <ul className="space-y-1 divide-y divide-gray-100 p-1">
        {items.length === 0 && <li className="p-2 text-gray-500">No results</li>}
        {Object.entries(groupedItems).map(([categoryName, groupItems]) => (
          <SlashCommandMenuCategory
            categoryName={categoryName}
            categoryOffset={groupOffsets[categoryName]}
            highlightedIndex={currentIndex}
            items={groupItems}
            key={categoryName}
            onItemSelected={runItem}
          />
        ))}
      </ul>
    </div>
  )
})

export default SlashCommandMenu

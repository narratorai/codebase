import { SlashCommandItem } from './items'
import SlashCommandMenuItem from './SlashCommandMenuItem'

interface Props {
  /** The category name */
  categoryName: string

  /** The offset of the category in the items list */
  categoryOffset: number

  /** The index of the highlighted item in the menu */
  highlightedIndex: number

  /** The items in the category */
  items: SlashCommandItem[]

  onItemSelected: (index: number) => void
}

export default function SlashCommandMenuCategory({
  categoryName,
  categoryOffset,
  items,
  highlightedIndex,
  onItemSelected,
}: Props) {
  return (
    <li>
      <p className="p-2 text-xs font-semibold text-gray-500">{categoryName}</p>

      {items.map((item, index) => {
        const absoluteIndex = categoryOffset - items.length + index

        return (
          <SlashCommandMenuItem
            focused={highlightedIndex === absoluteIndex}
            item={item}
            key={item.title}
            onClick={() => onItemSelected(absoluteIndex)}
          />
        )
      })}
    </li>
  )
}

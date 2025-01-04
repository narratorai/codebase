import CloseIcon from 'static/mavis/icons/close.svg'

import { SelectionItem } from './DatasetColumnMultiSelectMenu'

interface Props {
  getSelectedItemProps: (options: { selectedItem: SelectionItem; index: number }) => Record<string, unknown>
  index: number
  item: SelectionItem
  removeSelectedItem: (selectedItem: SelectionItem) => void
}

export default function DatasetColumnMultiSelectItem({ index, item, getSelectedItemProps, removeSelectedItem }: Props) {
  return (
    <span
      className="max-w-52 rounded bg-gray-50 text-sm text-gray-800 flex-x-center"
      {...getSelectedItemProps({
        selectedItem: item,
        index,
      })}
    >
      <p className="truncate p-1">{item.label}</p>
      <button
        className="p-1 text-xs"
        onClick={(e) => {
          e.stopPropagation()
          removeSelectedItem(item)
        }}
      >
        <CloseIcon className="h-4 w-4" />
      </button>
    </span>
  )
}

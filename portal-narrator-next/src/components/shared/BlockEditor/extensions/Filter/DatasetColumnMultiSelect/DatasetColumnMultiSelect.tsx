import clsx from 'clsx'
import { useState } from 'react'
import ChevronUpIcon from 'static/mavis/icons/chevron-up.svg'

import { useMultipleSelect } from '../hooks'
import DatasetColumnMultiSelectItem from './DatasetColumnMultiSelectItem'
import DatasetColumnMultiSelectMenu, { SelectionItem } from './DatasetColumnMultiSelectMenu'
import { useFilteredItems, useReportDatasetColummnsQuery } from './hooks'

interface Props {
  name: string
  onBlur?: (event: Event) => Promise<void>
  onChange: (value: SelectionItem[]) => void
  reportId: string
  value: SelectionItem[]
}

/**
 * Select component to choose multiple dataset columns (of the same kind).
 */
export default function DatasetColumnMultiSelect({ reportId, onChange, value }: Props) {
  const [inputValue, setInputValue] = useState<string | undefined>('')
  const { data: allColumns } = useReportDatasetColummnsQuery(reportId)
  const items = useFilteredItems(allColumns, value, inputValue)

  const {
    getDropdownProps,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    getSelectedItemProps,
    highlightedIndex,
    isOpen,
    removeSelectedItem,
  } = useMultipleSelect({ items, selectedItems: value, inputValue, setInputValue, onChange })

  return (
    <div className="space-y-2">
      <div className="inline-flex flex-wrap items-center gap-2">
        {value.map((item, index) => (
          <DatasetColumnMultiSelectItem
            getSelectedItemProps={getSelectedItemProps}
            index={index}
            item={item}
            key={item.id}
            removeSelectedItem={removeSelectedItem}
          />
        ))}
      </div>
      <div className="shadow-xs gap-1 overflow-hidden rounded-lg bordered-gray-100 flex-x-center">
        <input className="flex-1 !border-none focus:ring-0" {...getInputProps(getDropdownProps())} />
        <button aria-label="toggle menu" className="px-1" {...getToggleButtonProps()}>
          <ChevronUpIcon className={clsx('h-6 w-6 text-gray-600', { 'rotate-180': !isOpen })} />
        </button>
      </div>

      <div className="relative">
        <DatasetColumnMultiSelectMenu
          getItemProps={getItemProps}
          getMenuProps={getMenuProps}
          highlightedIndex={highlightedIndex}
          isOpen={isOpen}
          items={items}
        />
      </div>
    </div>
  )
}

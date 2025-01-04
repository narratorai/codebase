import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { isEmpty } from 'lodash'
import { useState } from 'react'
import ChevronUpIcon from 'static/mavis/icons/chevron-up.svg'

import { useDatasetQuery } from './hooks'

interface Props {
  className?: clsx.ClassValue
  datasetId: string
  datasetTabSlug: string
  enabled?: boolean
  onChange: (columnId: string) => void
  placeholder?: string
  value: string
}

export default function DatasetColumnSelect({
  value,
  datasetId,
  datasetTabSlug,
  placeholder,
  onChange,
  className,
  enabled = false,
}: Props) {
  const { isFetching, data: response } = useDatasetQuery(datasetId, { enabled })
  const tab = response?.allTabs.find((tab) => tab.slug === datasetTabSlug)
  const metricColumns = tab?.columns.filter((column) => column.type === 'number') ?? []

  const [items, setItems] = useState(metricColumns)
  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, selectedItem } =
    useCombobox({
      initialSelectedItem: metricColumns.find((item) => item.id === value),
      onInputValueChange({ inputValue }) {
        const initialData = metricColumns
        const lowerCasedInputValue = inputValue.toLowerCase()

        if (isEmpty(inputValue)) return setItems(initialData)
        setItems(initialData.filter((item) => item.label.toLowerCase().includes(lowerCasedInputValue)))
      },
      items,
      itemToString(item) {
        return item?.label ?? 'Unkown'
      },
      onSelectedItemChange({ selectedItem }) {
        onChange(selectedItem.id)
      },
    })

  return (
    <div className="space-y-2">
      <div className={clsx('shadow-xs gap-1 overflow-hidden rounded-lg bordered-gray-100 flex-x-center', className)}>
        <input
          className="flex-1 !border-none focus:ring-0"
          placeholder={placeholder}
          {...getInputProps({ disabled: !enabled })}
        />
        <button aria-label="toggle menu" className="px-1" type="button" {...getToggleButtonProps()}>
          <ChevronUpIcon className={clsx('h-6 w-6 text-gray-600', { 'rotate-180': !isOpen })} />
        </button>
      </div>

      <div className="relative">
        <ul
          {...getMenuProps()}
          className={clsx('absolute top-0 z-50 max-h-96 w-80 overflow-y-scroll rounded-md bg-white !p-0', {
            'shadow-sm bordered-gray-100': isOpen,
          })}
        >
          {!isFetching && isOpen && isEmpty(items) ? <p className="p-2 text-sm">No columns available</p> : null}

          {isOpen &&
            items.map((item, index) => (
              <li
                className={clsx('px-4 py-2', {
                  'bg-blue-200': highlightedIndex === index,
                  'bg-blue-600 text-white': selectedItem?.id === item.id,
                })}
                key={item.id}
                value={item.id}
                {...getItemProps({ item, index })}
              >
                {item.label}
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}

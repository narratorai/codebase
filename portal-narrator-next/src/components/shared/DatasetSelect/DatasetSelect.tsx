import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useCombobox } from 'downshift'
import { isEmpty } from 'lodash'
import { useState } from 'react'
import ChevronUpIcon from 'static/mavis/icons/chevron-up.svg'

import { useCompany } from '@/stores/companies'

import { fetchDatasets } from './ajax'

interface Props {
  className?: clsx.ClassValue
  onChange: (value: string) => void
  placeholder?: string
  value: React.ReactNode
}

export default function DatasetSelect({ value, placeholder, onChange, className }: Props) {
  const [companySlug, datacenterRegion] = useCompany((state) => [state.slug, state.datacenterRegion])

  const { data: response } = useQuery({
    queryKey: [companySlug, 'datasets'],
    queryFn: () => fetchDatasets(datacenterRegion),
  })
  const datasets = response?.data ?? []

  const [items, setItems] = useState(datasets ?? [])
  const { isOpen, getToggleButtonProps, getMenuProps, getInputProps, highlightedIndex, getItemProps, selectedItem } =
    useCombobox({
      initialSelectedItem: datasets.find((item) => item.id === value),
      onInputValueChange({ inputValue }) {
        const lowerCasedInputValue = inputValue.toLowerCase()

        if (isEmpty(inputValue)) return setItems(datasets)
        setItems(datasets.filter((item) => item.name.toLowerCase().includes(lowerCasedInputValue)))
      },
      items,
      itemToString(item) {
        return item?.name ?? 'Unkown'
      },
      onSelectedItemChange({ selectedItem }) {
        onChange(selectedItem.id)
      },
    })

  return (
    <div className="space-y-2">
      <div className={clsx('shadow-xs gap-1 overflow-hidden rounded-lg bordered-gray-100 flex-x-center', className)}>
        <input className="flex-1 !border-none focus:ring-0" placeholder={placeholder} {...getInputProps()} />
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
                {item.name}
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}

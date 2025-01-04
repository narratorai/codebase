import clsx from 'clsx'
import { groupBy, map } from 'lodash'

export type SelectionItem = {
  id: string
  label?: string
  type: 'string' | 'number' | 'boolean' | 'timestamp'
  dataset: {
    id: string
    name?: string
  }
  tab?: {
    slug: string
    label?: string
    kind: 'group' | 'parent'
  }
}

interface Props {
  getItemProps: (options: { item: SelectionItem; index: number }) => Record<string, unknown>
  getMenuProps: () => Record<string, unknown>
  highlightedIndex: number
  isOpen: boolean
  items: SelectionItem[]
}

export default function DatasetColumnMultiSelectMenu({
  items,
  getMenuProps,
  getItemProps,
  highlightedIndex,
  isOpen,
}: Props) {
  const groupedByDataset = groupBy(items, (item) => item.dataset.name)

  return (
    <ul
      {...getMenuProps()}
      className={clsx('absolute top-0 z-50 max-h-96 w-80 overflow-y-scroll rounded-md bg-white !p-0', {
        'shadow-sm bordered-gray-100': isOpen,
      })}
    >
      {isOpen &&
        map(groupedByDataset, (groupItems, datasetId) => (
          <li className="!m-0 !list-none !p-0" key={datasetId}>
            <p className="p-2 text-sm text-gray-600">{datasetId}</p>
            {groupItems.map((item) => {
              const absoluteIndex = items.indexOf(item)

              return (
                <div
                  className={clsx('px-4 py-2', {
                    'bg-blue-200': highlightedIndex === absoluteIndex,
                  })}
                  key={item.id}
                  {...getItemProps({ item, index: absoluteIndex })}
                >
                  {item.label}
                </div>
              )
            })}
          </li>
        ))}
    </ul>
  )
}

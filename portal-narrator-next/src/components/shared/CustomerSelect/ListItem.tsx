import clsx from 'clsx'

import { IRemoteActivity } from '@/stores/activities'
import { useTables } from '@/stores/tables'

interface Props {
  item: IRemoteActivity
  isSelected?: boolean
  isFocused?: boolean
}

const ListItem = ({ item, isSelected, isFocused }: Props) => {
  const getTable = useTables((state) => state.getTable)
  const table = getTable(item.tableId)

  return (
    <div
      className={clsx('li li-border !w-screen max-w-lg', {
        'li-selected': isSelected,
        'li-focused': isFocused,
      })}
    >
      <div className="li-details">
        <div className="li-line justify-between">
          <span className="li-label truncate">{item.name}</span>
          <div className="badge badge-md tonal pink-purple shrink-0">
            <span className="badge-label">{table?.identifier}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListItem

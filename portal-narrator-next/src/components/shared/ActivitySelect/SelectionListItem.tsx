import clsx from 'clsx'
import { useRef } from 'react'
import BookmarkIcon from 'static/mavis/icons/bookmark.svg'

import { IRemoteActivity } from '@/stores/activities'

import { MAX_VISIBLE_COLUMNS } from './constants'
import SelectionListItemColumns from './SelectionListItemColumns'

interface Props {
  item: IRemoteActivity
  isSelected?: boolean
  isFocused?: boolean
  onSelect?: (value: string, single?: boolean) => void
}

const SelectionListItem = ({ item, isSelected, isFocused, onSelect }: Props) => {
  const ref = useRef<HTMLButtonElement>(null)

  if (isFocused) ref.current?.focus()

  return (
    <button
      className={clsx('li li-border !w-screen max-w-lg', {
        'li-selected': isSelected,
        'li-focused': isFocused,
      })}
      ref={ref}
      onClick={() => onSelect?.(item.id, true)}
    >
      <div className="li-details pt-0.5">
        <div className="li-line justify-between">
          <span className="li-label">{item.name}</span>
          <BookmarkIcon className={clsx('li-icon', { 'fill-yellow-500': item.favorited })} />
        </div>
        <div className="li-line">
          <span className="li-help truncate">{item.description}</span>
        </div>
        <div className="li-line pt-4">
          <SelectionListItemColumns columns={item.columns} visibleCount={MAX_VISIBLE_COLUMNS} />
        </div>
      </div>
      <input
        type="checkbox"
        name={item.id}
        id={item.id}
        checked={isSelected}
        onClick={(e) => e.stopPropagation()}
        onChange={() => onSelect?.(item.id)}
        className="checkbox-input"
      />
    </button>
  )
}

export default SelectionListItem

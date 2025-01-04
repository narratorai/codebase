import clsx from 'clsx'
import { useRef } from 'react'

import { IRemoteJourneyActivity } from '@/stores/journeys'

interface Props {
  item: IRemoteJourneyActivity
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
      onClick={() => onSelect?.(item.customer, true)}
    >
      <div className="li-details pt-0.5">
        <div className="li-line justify-between">
          <span className="li-label">{item.customerDisplayName || item.customer}</span>
        </div>
        {item.customerDisplayName && (
          <div className="li-line">
            <span className="li-help truncate">{item.customer}</span>
          </div>
        )}
      </div>
    </button>
  )
}

export default SelectionListItem

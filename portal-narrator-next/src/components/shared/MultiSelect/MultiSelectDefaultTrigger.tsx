import { Trigger as PopoverTrigger } from '@radix-ui/react-popover'
import clsx from 'clsx'
import { map, slice } from 'lodash'
import { useContext } from 'react'
import ChevronDownIcon from 'static/mavis/icons/chevron-down.svg'

import { Badge, Label as BadgeLabel } from '@/components/shared/Badge'
import { Label as TagLabel, Tag } from '@/components/shared/Tag'

import Context from './Context'

interface Props {
  placeholder?: string
  tagColor?: 'transparent' | 'white' | 'green' | 'red' | 'purple' | 'yellow' | 'blue' | 'pink' | 'pink-purple' | 'gray'
  className?: string
  maxCount?: number
  valueFormatter?: (value: string) => string
}

const MultiSelectDefaultTrigger = ({
  placeholder,
  tagColor,
  className,
  maxCount = Infinity,
  valueFormatter = (value: string) => value,
}: Props) => {
  const { selected, handleOpen, multiselect } = useContext(Context)

  const count = selected.length
  const isSelected = count > 0
  const items = slice(selected, 0, maxCount)

  return (
    <PopoverTrigger onClick={handleOpen} className="w-full">
      <div
        className={clsx('justify-between gap-1 rounded-lg p-1 shadow-sm bordered-gray-100 flex-x-center', className)}
      >
        {isSelected && (
          <div className="flex-wrap gap-1 flex-x-center">
            {map(items, (item) => (
              <Tag key={item} size="lg" color={tagColor || 'transparent'}>
                <TagLabel>{valueFormatter(item)}</TagLabel>
              </Tag>
            ))}
          </div>
        )}
        {!isSelected && (
          <Tag size="lg" color="transparent">
            <TagLabel>{placeholder}</TagLabel>
          </Tag>
        )}

        {multiselect !== 'none' && isSelected && (
          <Badge appearance="tonal" color="pink" size="md">
            <BadgeLabel>{count}</BadgeLabel>
          </Badge>
        )}

        <ChevronDownIcon className="size-5" />
      </div>
    </PopoverTrigger>
  )
}

export default MultiSelectDefaultTrigger

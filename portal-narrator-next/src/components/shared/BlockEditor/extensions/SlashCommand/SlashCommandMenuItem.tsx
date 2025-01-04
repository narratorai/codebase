import clsx from 'clsx'
import { useEffect, useRef } from 'react'

import { SlashCommandItem } from './items'

interface Props {
  focused?: boolean
  item: SlashCommandItem
  onClick: () => void
}

export default function SlashCommandMenuItem({ item, onClick, focused = false }: Props) {
  const ref = useRef<HTMLLIElement>(null)
  const { title, Icon } = item

  useEffect(() => {
    if (focused) {
      ref.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [focused])

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
    <li
      className={clsx('cursor-pointer space-x-3 rounded p-1.5 flex-x-center hover:bg-gray-50', {
        'bg-gray-50': focused,
      })}
      onClick={onClick}
      ref={ref}
    >
      <Icon className="size-4" />
      <p className="text-sm">{title}</p>
    </li>
  )
}

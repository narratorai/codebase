import type { Meta, StoryObj } from '@storybook/react'
import { useRef } from 'react'

import { ContentScrollArea, Item, MultiSelect, MultiSelectContent, MultiSelectDefaultTrigger } from '.'

const MultiSelectItem = ({ value, name, isSelected, isFocused, onSelect }: any) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  if (isFocused) buttonRef.current?.focus()

  return (
    <button
      onClick={() => onSelect(value, true)}
      ref={buttonRef}
      className="w-full rounded-lg p-4 bordered-gray-100 focus:border-blue-500"
    >
      <div>
        <div>{name}</div>
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={() => onSelect(value)}
        />
      </div>
    </button>
  )
}

const Component = ({ items }: { items: string[] }) => {
  return (
    <MultiSelect multiselect="optional">
      <MultiSelectDefaultTrigger placeholder="Select options..." tagColor="green" />
      <MultiSelectContent collisionPadding={64}>
        <div className="py-4 pl-4 pr-1">
          <ContentScrollArea className="flex flex-col gap-4 pr-3">
            {items.map((item) => (
              <Item key={item} value={item}>
                <MultiSelectItem name={item} value={item} />
              </Item>
            ))}
          </ContentScrollArea>
        </div>
      </MultiSelectContent>
    </MultiSelect>
  )
}

const items1 = [
  'item-item-item-item-item-item-item-1',
  'item-item-item-item-item-item-item-2',
  'item-item-item-item-item-item-item-3',
]

const items2 = [
  'item-item-item-item-item-item-item-1',
  'item-item-item-item-item-item-item-2',
  'item-item-item-item-item-item-item-3',
  'item-item-item-item-item-item-item-4',
  'item-item-item-item-item-item-item-5',
  'item-item-item-item-item-item-item-6',
]

const items3 = [
  'item-item-item-item-item-item-item-1',
  'item-item-item-item-item-item-item-2',
  'item-item-item-item-item-item-item-3',
  'item-item-item-item-item-item-item-4',
  'item-item-item-item-item-item-item-5',
  'item-item-item-item-item-item-item-6',
  'item-item-item-item-item-item-item-7',
  'item-item-item-item-item-item-item-8',
  'item-item-item-item-item-item-item-9',
]

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/MultiSelect',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
  name: 'Three Items',
  args: {
    items: items1,
  },
}

export const Medium: Story = {
  name: 'Six Items',
  args: {
    items: items2,
  },
}

export const Large: Story = {
  name: 'Nine Items',
  args: {
    items: items3,
  },
}

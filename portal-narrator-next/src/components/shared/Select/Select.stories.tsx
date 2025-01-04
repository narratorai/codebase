import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { ItemText, SelectContent, SelectDefaultTrigger, SelectItem, SelectItemIndicator, SelectRoot } from '.'

const Item = ({ children, value }: { children: React.ReactNode; value: string }) => {
  return (
    <SelectItem value={value} className="cursor-pointer">
      <ItemText>{children}</ItemText>
      <SelectItemIndicator />
    </SelectItem>
  )
}

const Component = ({ items }: { items: { label: string; value: string }[] }) => {
  const [value, setValue] = useState<string | undefined>()

  return (
    <SelectRoot value={value} onValueChange={setValue}>
      <SelectDefaultTrigger placeholder="Select an item">{value}</SelectDefaultTrigger>

      <SelectContent align="start" sideOffset={4} alignOffset={0}>
        {items.map((item) => (
          <Item key={item.value} value={item.value}>
            {item.label}
          </Item>
        ))}
      </SelectContent>
    </SelectRoot>
  )
}

const items1 = [
  { label: 'Item 1', value: 'item-1' },
  { label: 'Item 2', value: 'item-2' },
  { label: 'Item 3', value: 'item-3' },
]

const items2 = [
  { label: 'Item 1', value: 'item-1' },
  { label: 'Item 2', value: 'item-2' },
  { label: 'Item 3', value: 'item-3' },
  { label: 'Item 4', value: 'item-4' },
  { label: 'Item 5', value: 'item-5' },
  { label: 'Item 6', value: 'item-6' },
]

const items3 = [
  { label: 'Item 1', value: 'item-1' },
  { label: 'Item 2', value: 'item-2' },
  { label: 'Item 3', value: 'item-3' },
  { label: 'Item 4', value: 'item-4' },
  { label: 'Item 5', value: 'item-5' },
  { label: 'Item 6', value: 'item-6' },
  { label: 'Item 7', value: 'item-7' },
  { label: 'Item 8', value: 'item-8' },
  { label: 'Item 9', value: 'item-9' },
]

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/Select',
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

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { useState } from 'react'

import { OptionDescription, OptionLabel } from '../Options'
import { Combobox, ComboboxOption, ComboboxOptionContents, ComboboxOptions } from '.'

const Circle = ({ className }: any) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4px" cy="4px" r="4px" />
  </svg>
)

interface Item {
  description: string
  id: number
  label: string
  online: boolean
  value: string
}

const items = [
  { description: 'Description A', id: 1, label: 'Option A', online: true, value: 'option1' },
  { description: 'Description B', id: 2, label: 'Option B', online: false, value: 'option2' },
  { description: 'Description C', id: 3, label: 'Option C', online: true, value: 'option3' },
]

const uncontrolledItems = ['Option A', 'Option B', 'Option C']

const Component = ({ anchor, multiple, onChange, OptionTemplate, ...props }: any) => {
  const [query, setQuery] = useState('')
  const [selectedValues, setSelectedValues] = useState<Item | Item[] | null>(multiple ? [] : null)

  const filteredItems =
    query === ''
      ? items
      : items.filter((item) => {
          return item.label.toLowerCase().includes(query.toLowerCase())
        })

  const handleChange = (values: Item | Item[]) => {
    setQuery('')
    setSelectedValues(values)
    onChange(values)
  }

  const formatLabel = (values: Item | Item[] | null) => {
    if (Array.isArray(values)) return values.map((value) => value.label).join(', ')
    if (values !== null) return values.label
    return ''
  }

  return (
    <Combobox<Item | Item[]>
      {...props}
      displayValue={formatLabel}
      multiple={multiple}
      onChange={handleChange}
      onSearchBlur={() => setQuery('')}
      onSearchChange={setQuery}
      value={selectedValues}
    >
      {filteredItems.length > 0 && (
        <ComboboxOptions anchor={anchor}>
          {filteredItems.map((item) => (
            <OptionTemplate item={item} key={item.id} />
          ))}
        </ComboboxOptions>
      )}
    </Combobox>
  )
}

/**
 * Combobox primitive component used throughout the app.
 */
const meta: Meta<typeof Component> = {
  args: {
    onChange: fn(),
  },
  argTypes: {
    anchor: { control: 'text' },
    'aria-label': { control: 'text' },
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    immediate: { control: 'boolean' },
    multiple: { control: 'boolean' },
    name: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'text' },
  },
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    anchor: 'bottom start',
    'aria-label': 'Select option',
    multiple: false,
    name: 'combo-box',
    OptionTemplate: ({ item }: any) => (
      <ComboboxOption key={item.id} value={item}>
        <ComboboxOptionContents>{item.label}</ComboboxOptionContents>
      </ComboboxOption>
    ),
    placeholder: 'Select option...',
  },
}

export const WithIcons: Story = {
  args: {
    anchor: 'bottom start',
    'aria-label': 'Select option',
    multiple: false,
    name: 'combo-box',
    OptionTemplate: ({ item }: any) => (
      <ComboboxOption key={item.id} value={item}>
        <ComboboxOptionContents>
          {item.online ? (
            <Circle
              className="relative top-1.5 size-5 fill-green-500 group-data-[focus]:!fill-white"
              data-slot="icon"
            />
          ) : (
            <Circle className="relative top-1.5 size-5 fill-red-500 group-data-[focus]:!fill-white" data-slot="icon" />
          )}
          <OptionLabel>{item.label}</OptionLabel>
        </ComboboxOptionContents>
      </ComboboxOption>
    ),
    placeholder: 'Select option...',
  },
}

export const WithLabelAndDescription: Story = {
  args: {
    anchor: 'bottom start',
    'aria-label': 'Select option',
    multiple: false,
    name: 'combo-box',
    OptionTemplate: ({ item }: any) => (
      <ComboboxOption key={item.id} value={item}>
        <ComboboxOptionContents>
          <OptionLabel>{item.label}</OptionLabel>
          <OptionDescription>{item.description}</OptionDescription>
        </ComboboxOptionContents>
      </ComboboxOption>
    ),
    placeholder: 'Select option...',
  },
}

export const Uncontrolled: Story = {
  args: {
    anchor: 'bottom start',
    'aria-label': 'Select option',
    multiple: false,
    name: 'combo-box',
    placeholder: 'Select option...',
  },
  render: ({ anchor, onChange, ...props }: any) => {
    const [query, setQuery] = useState('')

    const filteredItems =
      query === ''
        ? uncontrolledItems
        : uncontrolledItems.filter((item) => {
            return item.toLowerCase().includes(query.toLowerCase())
          })

    return (
      <Combobox<string> {...props} displayValue={(value: string) => value} onSearchChange={setQuery}>
        <ComboboxOptions anchor={anchor}>
          {filteredItems.map((item) => (
            <ComboboxOption key={item} value={item}>
              <ComboboxOptionContents>{item}</ComboboxOptionContents>
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </Combobox>
    )
  },
}

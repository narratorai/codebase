import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Column } from '../Axis'
import {
  OptionDescription,
  OptionDivider,
  OptionHeading,
  OptionLabel,
  OptionSection,
  OptionSeparator,
} from '../Options'
import { Listbox, ListboxOption, ListboxOptionContents } from '.'

const Circle = ({ className }: any) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4px" cy="4px" r="4px" />
  </svg>
)

interface Item {
  description: string
  label: string
  online: boolean
  value: string
}

const items = [
  { description: 'Description 1', label: 'Option 1', online: true, value: 'option1' },
  { description: 'Description 2', label: 'Option 2', online: false, value: 'option2' },
  { description: 'Description 3', label: 'Option 3', online: true, value: 'option3' },
]

const items2 = [
  { description: 'Description 4', label: 'Option 4', online: true, value: 'option4' },
  { description: 'Description 5', label: 'Option 5', online: false, value: 'option5' },
  { description: 'Description 6', label: 'Option 6', online: true, value: 'option6' },
]

/**
 * Listbox primitive component used throughout the app.
 */
const meta: Meta<typeof Listbox<Item>> = {
  args: {
    displayValue: (value: Item) => value.label,
    onChange: fn(),
    onScroll: fn(),
  },
  argTypes: {
    anchor: { control: 'text' },
    'aria-label': { control: 'text' },
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    name: { control: 'text' },
    placeholder: { control: 'text' },
    value: { control: 'text' },
  },
  component: Listbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    anchor: 'selection start',
    'aria-label': 'Select option',
    name: 'list-box',
    placeholder: 'Select option...',
  },
  render: (args) => (
    <Listbox<Item> {...args}>
      {items.map((item) => (
        <ListboxOption<Item> key={item.value} value={item}>
          <ListboxOptionContents>{item.label}</ListboxOptionContents>
        </ListboxOption>
      ))}
    </Listbox>
  ),
}

export const WithIcons: Story = {
  args: {
    anchor: 'bottom start',
    'aria-label': 'Select option',
    name: 'list-box',
    placeholder: 'Select option...',
  },
  render: (args) => (
    <Listbox<Item> {...args}>
      {items.map((item) => (
        <ListboxOption<Item> key={item.value} value={item}>
          <ListboxOptionContents>
            {item.online ? (
              <Circle
                className="relative top-1.5 size-5 fill-green-500 group-data-[focus]:!fill-white"
                data-slot="icon"
              />
            ) : (
              <Circle
                className="relative top-1.5 size-5 fill-red-500 group-data-[focus]:!fill-white"
                data-slot="icon"
              />
            )}
            <OptionLabel>{item.label}</OptionLabel>
          </ListboxOptionContents>
        </ListboxOption>
      ))}
    </Listbox>
  ),
}

export const WithLabelAndDescription: Story = {
  args: {
    anchor: 'bottom start',
    'aria-label': 'Select option',
    name: 'list-box',
    placeholder: 'Select option...',
  },
  render: (args) => (
    <Listbox<Item> {...args}>
      {items.map((item) => (
        <ListboxOption<Item> key={item.value} value={item}>
          <ListboxOptionContents>
            <OptionLabel>{item.label}</OptionLabel>
            <OptionDescription>{item.description}</OptionDescription>
          </ListboxOptionContents>
        </ListboxOption>
      ))}
    </Listbox>
  ),
}

export const WithLabelAndDoubleDescription: Story = {
  args: {
    anchor: 'bottom start',
    'aria-label': 'Select option',
    name: 'list-box',
    placeholder: 'Select option...',
  },
  render: (args) => (
    <Listbox<Item> {...args}>
      {items.map((item) => (
        <ListboxOption<Item> key={item.value} value={item}>
          <ListboxOptionContents>
            <OptionLabel>{item.label}</OptionLabel>
            <OptionDescription>
              <Column>
                <span>{item.description} A</span>
                <span>{item.description} B</span>
              </Column>
            </OptionDescription>
          </ListboxOptionContents>
        </ListboxOption>
      ))}
    </Listbox>
  ),
}

export const WithSectionsAndHeadings: Story = {
  args: {
    anchor: 'bottom start',
    'aria-label': 'Select option',
    name: 'list-box',
    placeholder: 'Select option...',
  },
  render: (args) => (
    <Listbox<Item> {...args}>
      <OptionSection>
        {items.map((item) => (
          <ListboxOption<Item> key={item.value} value={item}>
            <ListboxOptionContents>
              <OptionLabel>{item.label}</OptionLabel>
              <OptionDescription>{item.description}</OptionDescription>
            </ListboxOptionContents>
          </ListboxOption>
        ))}
      </OptionSection>
      <OptionSeparator />
      <OptionSection>
        <OptionHeading>Section Heading 2</OptionHeading>
        {items2.map((item) => (
          <ListboxOption<Item> key={item.value} value={item}>
            <ListboxOptionContents>
              <OptionLabel>{item.label}</OptionLabel>
              <OptionDescription>{item.description}</OptionDescription>
            </ListboxOptionContents>
          </ListboxOption>
        ))}
      </OptionSection>
    </Listbox>
  ),
}

export const WithDivider: Story = {
  args: {
    anchor: 'bottom start',
    'aria-label': 'Select option',
    name: 'list-box',
    placeholder: 'Select option...',
  },
  render: (args) => (
    <Listbox<Item> {...args}>
      {items.map((item, index) => (
        <ListboxOption<Item> key={item.value} value={item}>
          <ListboxOptionContents>
            <OptionLabel>{item.label}</OptionLabel>
            <OptionDescription>{item.description}</OptionDescription>
          </ListboxOptionContents>
          {index < items.length - 1 && <OptionDivider />}
        </ListboxOption>
      ))}
    </Listbox>
  ),
}

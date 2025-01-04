import { ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Button } from '../Button'
import { Input, InputGroup } from '.'

/**
 * Input primitive component used throughout the app.
 */
const meta: Meta<typeof Input> = {
  args: {
    name: 'input',
    onChange: fn(),
    placeholder: 'Input value...',
    type: 'text',
  },
  argTypes: {
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    name: { control: 'text' },
    placeholder: { control: 'text' },
    type: {
      control: 'select',
      options: [
        'email',
        'number',
        'password',
        'search',
        'tel',
        'text',
        'url',
        'date',
        'datetime-local',
        'month',
        'time',
        'week',
      ],
    },
    value: { control: 'text' },
  },
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithLeadingIcon: Story = {
  render: (args) => (
    <InputGroup>
      <MagnifyingGlassIcon />
      <Input {...args} />
    </InputGroup>
  ),
}

export const WithTrailingIcon: Story = {
  render: (args) => (
    <InputGroup>
      <Input {...args} />
      <ChevronUpDownIcon />
    </InputGroup>
  ),
}

export const WithTrailingIconButton: Story = {
  render: (args) => (
    <InputGroup>
      <Input {...args} />
      <Button data-slot="button" icon plain>
        <ChevronUpDownIcon />
      </Button>
    </InputGroup>
  ),
}

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Radio, RadioField, RadioGroup } from '.'

const Component = (props: any) => (
  <RadioGroup {...props}>
    <RadioField>
      <Radio color={props.color} value="radio1" />
    </RadioField>
    <RadioField>
      <Radio color={props.color} value="radio2" />
    </RadioField>
    <RadioField>
      <Radio color={props.color} value="radio3" />
    </RadioField>
  </RadioGroup>
)

/**
 * Radio primitive component used throughout the app.
 */
const meta: Meta<typeof Component> = {
  args: {
    onChange: fn(),
  },
  argTypes: {
    color: {
      control: 'select',
      options: [
        'dark/zinc',
        'dark/white',
        'white',
        'dark',
        'zinc',
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose',
      ],
    },
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
  },
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    color: 'dark/zinc',
    defaultValue: 'radio1',
    disabled: false,
    name: 'radio-group',
  },
}

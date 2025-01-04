/* eslint-disable react/jsx-max-depth */
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Description, Label } from '../Fieldset'
import { RadioCard, RadioCardField, RadioCardGroup } from '.'

const Component = (props: any) => (
  <div className="flex justify-center bg-white px-8 py-12">
    <fieldset>
      <RadioCardGroup {...props}>
        <RadioCardField>
          <RadioCard color={props.color} value="radio1">
            <Label>Label 1</Label>
            <Description>First Description 1</Description>
            <Description>Second Description 1</Description>
            <Description>Third Description 1</Description>
          </RadioCard>
        </RadioCardField>

        <RadioCardField>
          <RadioCard color={props.color} value="radio2">
            <Label>Label 2</Label>
            <Description>First Description 2</Description>
            <Description>Second Description 2</Description>
            <Description>Third Description 2</Description>
          </RadioCard>
        </RadioCardField>

        <RadioCardField>
          <RadioCard color={props.color} value="radio3">
            <Label>Label 3</Label>
            <Description>First Description 3</Description>
            <Description>Second Description 3</Description>
            <Description>Third Description 3</Description>
          </RadioCard>
        </RadioCardField>
      </RadioCardGroup>
    </fieldset>
  </div>
)

/**
 * RadioCard primitive component used throughout the app.
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

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import clsx from 'clsx'

type ButtonProps = { className: string } & React.ButtonHTMLAttributes<HTMLButtonElement>

const meta = {
  title: 'Components/Shared/Button',
  render: ({ className, children, ...props }: ButtonProps) => (
    <button className={clsx(className)} {...props}>
      {children}
    </button>
  ),
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    className: {
      options: [
        'button',
        'button-md',
        'button-sm',
        'buttom-xs',
        'filled',
        'outlined',
        'tonal',
        'text',
        'primary',
        'secondary',
        'danger',
      ],
      control: { type: 'check' },
    },
    disabled: { control: 'boolean' },
  },
  args: { onClick: fn(), children: 'Update' },
} satisfies Meta<ButtonProps>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  name: 'Primary Button',
  args: {
    className: 'button button-md primary filled',
    disabled: false,
  },
}

export const Secondary: Story = {
  name: 'Secondary Button',
  args: {
    className: 'button button-md secondary filled',
    disabled: false,
  },
}

export const Danger: Story = {
  name: 'Danger Button',
  args: {
    className: 'button button-md danger filled',
    disabled: false,
  },
}

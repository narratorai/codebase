import type { Meta, StoryObj } from '@storybook/react'

import { Popover, PopoverContent, PopoverTrigger } from '.'

interface Props {
  children?: React.ReactNode
}

const Component = ({ children }: Props) => (
  <Popover>
    <PopoverTrigger>Target</PopoverTrigger>
    <PopoverContent>{children}</PopoverContent>
  </Popover>
)

const Children = () => (
  <p className="p-4">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
    aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
    sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
  </p>
)

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/Popover',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Popover',
  args: {
    children: <Children />,
  },
}

import type { Meta, StoryObj } from '@storybook/react'

import { Dialog, DialogContent, DialogHeader, DialogTrigger } from '.'

const Component = () => (
  <Dialog>
    <DialogTrigger>
      <button>Open</button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>DialogTitle</DialogHeader>
      <div>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam nec purus ac libero ultrices aliquam.</div>
    </DialogContent>
  </Dialog>
)

/**
 * Dialog Component.
 */
const meta = {
  title: 'Components/Shared/Dialog',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Dialog',
  args: {},
}

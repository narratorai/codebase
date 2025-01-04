import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Button } from '../Button'
import { Dialog, DialogActions, DialogBody, DialogDescription, DialogTitle } from '.'
import { SIZES } from './constants'
const SIZES_OPTIONS = Object.keys(SIZES)

/**
 * Dialog primitive component used throughout the app.
 */
const meta: Meta<typeof Dialog> = {
  component: Dialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: SIZES_OPTIONS },
    open: { control: 'boolean' },
  },
  args: {
    size: 'md',
    open: true,
    onClose: fn(),
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription size="sm">Dialog description.</DialogDescription>
      <DialogBody>Dialog body.</DialogBody>
      <DialogActions>
        <Button plain>Cancel</Button>
        <Button autoFocus>Action</Button>
      </DialogActions>
    </Dialog>
  ),
}

import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Button } from '../Button'
import { Alert, AlertActions, AlertBody, AlertDescription, AlertTitle } from '.'
import { SIZES } from './constants'

const SIZES_OPTIONS = Object.keys(SIZES)

/**
 * Alert primitive component used throughout the app.
 */
const meta: Meta<typeof Alert> = {
  argTypes: {
    size: { control: 'select', options: SIZES_OPTIONS },
    open: { control: 'boolean' },
  },
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
    <Alert {...args}>
      <AlertTitle>Alert Title</AlertTitle>
      <AlertDescription size="sm">Alert description.</AlertDescription>
      <AlertBody>Alert body.</AlertBody>
      <AlertActions>
        <Button autoFocus plain>
          Cancel
        </Button>
        <Button>Acknowledge</Button>
      </AlertActions>
    </Alert>
  ),
}

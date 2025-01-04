import type { Meta, StoryObj } from '@storybook/react'

import Component from '.'
import { mock } from './util'

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/CustomerJourneyConfigView',
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
  name: 'Story Name',
  args: {
    config: mock,
  },
}

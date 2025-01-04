import type { Meta, StoryObj } from '@storybook/react'

import { IRemoteDataset } from '@/stores/datasets'

import Component from './DatasetConfigView'
import { mock } from './util'

/**
 * Dataset Config View component.
 */
const meta = {
  title: 'Components/Shared/DatasetConfigView',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    dataset: { control: 'object' },
    groupSlug: { control: 'text' },
    plotSlug: { control: 'text' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Dataset Config View',
  args: {
    dataset: mock as unknown as IRemoteDataset,
    groupSlug: 'month0798ca01',
    plotSlug: 'conversion_rate_to_completed_order_between_by_month',
  },
}

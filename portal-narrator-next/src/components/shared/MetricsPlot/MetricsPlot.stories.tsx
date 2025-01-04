import type { Meta, StoryObj } from '@storybook/react'

import { DisplayFormat } from '@/stores/datasets'

import MetricsPlot from '.'

const DISPLAY_FORMATS_OPTIONS = Object.values(DisplayFormat)

/**
 * MetricsPlot shared component used throughout the app.
 */
const meta: Meta<typeof MetricsPlot> = {
  component: MetricsPlot,
  decorators: [
    (Story) => (
      <div className="w-[calc(100vw-32px)]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    format: { control: 'select', options: DISPLAY_FORMATS_OPTIONS },
    value: { control: 'text' },
    valueColor: { control: 'text' },
    comparisonValue: { control: 'text' },
    comparisonText: { control: 'text' },
    tickerValue: { control: 'number' },
    tickerFormat: { control: 'select', options: DISPLAY_FORMATS_OPTIONS },
    align: { control: 'select', options: ['left', 'right', 'center'] },
    plotConfig: { control: 'object' },
    config: { control: 'object' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Total Subscribers',
    subtitle: '2024-01-01 to 2024-01-31',
    format: DisplayFormat.Decimal,
    value: '71897',
    valueColor: 'indigo',
    comparisonValue: '70946',
    comparisonText: 'from',
    tickerValue: 0.12,
    tickerFormat: DisplayFormat.TickerPercent,
  },
}

export const WithoutSubtitle: Story = {
  args: {
    title: 'Total Subscribers',
    format: DisplayFormat.Decimal,
    value: '71897',
    valueColor: 'indigo',
    comparisonValue: '70946',
    comparisonText: 'from',
    tickerValue: 0.12,
    tickerFormat: DisplayFormat.TickerPercent,
  },
}

export const WithoutComparisonValue: Story = {
  args: {
    title: 'Total Subscribers',
    subtitle: '2024-01-01 to 2024-01-31',
    format: DisplayFormat.Decimal,
    value: '71897',
    valueColor: 'indigo',
    tickerValue: 0.12,
    tickerFormat: DisplayFormat.TickerPercent,
  },
}

export const WithoutTicker: Story = {
  args: {
    title: 'Total Subscribers',
    subtitle: '2024-01-01 to 2024-01-31',
    format: DisplayFormat.Decimal,
    value: '71897',
    valueColor: 'indigo',
    comparisonValue: '70946',
    comparisonText: 'from',
  },
}

export const WithTitleAndValueOnly: Story = {
  args: {
    title: 'Total Subscribers',
    format: DisplayFormat.Decimal,
    value: '71897',
    valueColor: 'indigo',
  },
}

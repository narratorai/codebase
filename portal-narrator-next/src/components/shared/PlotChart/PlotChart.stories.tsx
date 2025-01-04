import type { Meta, StoryObj } from '@storybook/react'

import PlotChart from '.'
import { chartType, plotConfig, plotConfigNoData } from './mock'

/**
 * PlotChart shared component used throughout the app.
 */
const meta: Meta<typeof PlotChart> = {
  component: PlotChart,
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
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <PlotChart chartType={chartType} height={480} plotConfig={plotConfig} />,
}

export const NoPlotData: Story = {
  render: () => <PlotChart chartType={chartType} height={480} plotConfig={plotConfigNoData} />,
}

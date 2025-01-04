import { Provider } from '@radix-ui/react-tooltip'
import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '../Button'
import { Tooltip } from '.'

/**
 * Tooltip primitive component used throughout the app.
 */
const meta: Meta<typeof Tooltip> = {
  args: {
    content: {
      sideOffset: 4,
    },
    showArrow: true,
    tip: 'Tooltip label text',
  },
  argTypes: {
    tip: { control: 'text' },
  },
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Provider>
      <Tooltip {...args}>
        <Button>Target</Button>
      </Tooltip>
    </Provider>
  ),
}

export const OnDark: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: (args) => (
    <div className="dark">
      <Provider>
        <Tooltip {...args}>
          <Button>Target</Button>
        </Tooltip>
      </Provider>
    </div>
  ),
}

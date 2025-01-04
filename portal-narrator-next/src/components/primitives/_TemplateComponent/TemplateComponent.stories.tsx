import type { Meta, StoryObj } from '@storybook/react'

import { Placeholder } from '../Placeholder'
import { TemplateComponent } from '.'

/**
 * Template Component description visible in the storybook.
 */
const meta: Meta<typeof TemplateComponent> = {
  component: TemplateComponent,
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
  render: () => (
    <TemplateComponent>
      <Placeholder size="lg" />
    </TemplateComponent>
  ),
}

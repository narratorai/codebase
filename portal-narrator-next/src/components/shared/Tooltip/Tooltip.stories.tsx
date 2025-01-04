import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Content, Description, Label, Portal, Provider, Root, TooltipTrigger } from '.'

const Tooltip = ({ onClick, label, description }: { onClick?: () => void; label?: string; description?: string }) => (
  <Provider>
    <Root>
      <TooltipTrigger>
        <button className="rounded-lg bg-white p-2 bordered-gray-200" onClick={onClick}>
          Some Button
        </button>
      </TooltipTrigger>
      {label && (
        <Portal>
          <Content>
            <Label>{label}</Label>
            {description && (
              <div className="px-3 pb-2">
                <Description>{description}</Description>
              </div>
            )}
          </Content>
        </Portal>
      )}
    </Root>
  </Provider>
)

/**
 * Tooltip.
 */
const meta = {
  title: 'Components/Shared/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const TooltipNone: Story = {
  name: 'Tooltip - None',
  args: {},
}

export const TooltipLabel: Story = {
  name: 'Tooltip - Label',
  args: {
    label: 'Tooltip Label',
  },
}

export const TooltipLabelAndDescription: Story = {
  name: 'Tooltip - Description',
  args: {
    label: 'Tooltip Label',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
}

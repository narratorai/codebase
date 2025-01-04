import type { Meta, StoryObj } from '@storybook/react'

import { Content, Indicator, List, Root, Trigger } from '.'

const Tabs = () => (
  <Root defaultValue="tab-1">
    <List className="flex flex-row gap-8">
      <Trigger value="tab-1" className="p-1">
        Tab 1
      </Trigger>
      <Trigger value="tab-2" className="p-1">
        Tab 2
      </Trigger>
      <Trigger value="tab-3" className="p-1">
        Tab 3
      </Trigger>
    </List>
    <Indicator />
    <Content value="tab-1" className="px-2 py-4">
      Content 1
    </Content>
    <Content value="tab-2" className="px-2 py-4">
      Content 2
    </Content>
    <Content value="tab-3" className="px-2 py-4">
      Content 3
    </Content>
  </Root>
)

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Story Name',
  args: {},
}

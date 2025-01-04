import type { Meta, StoryObj } from '@storybook/react'

import { Corner, HorizontalScrollbar, Root, VerticalScrollbar, Viewport } from '.'

interface Props {
  children: React.ReactNode
}

const ScrollArea = ({ children }: Props) => (
  <Root className="h-40 w-96">
    <Viewport>{children}</Viewport>
    <VerticalScrollbar />
    <HorizontalScrollbar />
    <Corner />
  </Root>
)

const Children = () => (
  <>
    <p className="w-[768px] p-2">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
    <p className="w-[768px] p-2">
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </p>
  </>
)

/**
 * Scroll Area
 */
const meta = {
  title: 'Components/Shared/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Scroll Area (384px by 160px)',
  args: {
    children: <Children />,
  },
}

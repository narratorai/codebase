import type { Meta, StoryObj } from '@storybook/react'

import type { ILine } from '.'
import {
  Content,
  getBoldToken,
  getGreenTagToken,
  getPinkPurpleTagToken,
  getPurpleTagToken,
  getRegularToken,
  getSpaceToken,
  Line,
} from '.'

const Component = ({ lines }: { lines: ILine[] }) => (
  <Content>
    {lines.map((line, index) => (
      <Line key={index} tokens={line.tokens} />
    ))}
  </Content>
)

const lines = [
  {
    tokens: [
      getRegularToken('Lorem'),
      getSpaceToken(),
      getBoldToken('ipsum'),
      getSpaceToken(),
      getGreenTagToken('dolor'),
      getSpaceToken(),
      getPurpleTagToken('sit'),
      getSpaceToken(),
      getPinkPurpleTagToken('amet'),
    ],
  },
  {
    tokens: [
      getRegularToken('consectetur'),
      getSpaceToken(),
      getBoldToken('adipiscing'),
      getSpaceToken(),
      getGreenTagToken('elit'),
      getSpaceToken(),
      getPurpleTagToken('sed'),
      getSpaceToken(),
      getPinkPurpleTagToken('do'),
    ],
  },
]

/**
 * Template Component description visible in the storybook.
 */
const meta = {
  title: 'Components/Shared/TagContent',
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    lines: { control: 'object' },
  },
} satisfies Meta<typeof Component>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Story Name',
  args: {
    lines: lines,
  },
}

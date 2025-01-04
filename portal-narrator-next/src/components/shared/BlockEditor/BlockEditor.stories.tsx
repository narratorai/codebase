import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import BlockEditor from './BlockEditor'

const content = {
  type: 'doc',
  content: [
    {
      'data-uid': '71b079a1-7df4-4b47-b379-65613c568326',
      type: 'heading',
      attrs: {
        level: 1,
      },
      content: [
        {
          type: 'text',
          text: 'The editor suite to build products',
        },
      ],
    },
    {
      'data-uid': '8512c9df-54da-46d4-99e7-3f27d94db62e',
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Tiptap is a headless editor framework with an open source core. Integrate over 100+ extensions like collaboration and AI agents and create the UX you want.',
        },
      ],
    },
    {
      type: 'horizontalRule',
    },
  ],
}

const meta = {
  title: 'components/shared/BlockEditor',
  component: BlockEditor,
  decorators: [
    (Story) => (
      <div style={{ margin: '3rem' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    compileContext: {
      reportId: '1bada8b1-25bb-4922-9927-b3d33d146493',
    },
    content,
    onChange: fn(),
    readOnly: false,
  },
} satisfies Meta<typeof BlockEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

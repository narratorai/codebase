/* eslint-disable react/jsx-max-depth */
import { ArrowUpCircleIcon, PaperClipIcon } from '@heroicons/react/24/solid'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Avatar } from '../Avatar'
import { Row } from '../Axis'
import { Button } from '../Button'
import { Textarea, TextareaActions } from '.'

/**
 * Textarea primitive component used throughout the app.
 */
const meta: Meta<typeof Textarea> = {
  args: {
    onChange: fn(),
  },
  argTypes: {
    defaultValue: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    name: { control: 'text' },
    placeholder: { control: 'text' },
    resizable: { control: 'boolean' },
    rows: { control: 'number' },
    value: { control: 'text' },
  },
  component: Textarea,
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

export const WithoutActions: Story = {
  args: {
    autoFocus: true,
    name: 'textarea',
    placeholder: 'Input text...',
    resizable: true,
    rows: 3,
  },
  render: (args) => <Textarea {...args} />,
}

export const WithActions: Story = {
  args: {
    autoFocus: true,
    name: 'textarea',
    placeholder: 'Input text...',
    resizable: false,
    rows: 3,
  },
  render: ({ disabled, ...args }) => (
    <Textarea disabled={disabled} {...args}>
      <TextareaActions>
        <Row full x="between">
          <Button disabled={disabled} plain>
            <PaperClipIcon />
          </Button>

          <Button disabled={disabled} icon size="xl">
            <ArrowUpCircleIcon />
          </Button>
        </Row>
      </TextareaActions>
    </Textarea>
  ),
}

export const WithAvatarAndActions: Story = {
  args: {
    autoFocus: true,
    name: 'textarea',
    placeholder: 'Input text...',
    resizable: false,
    rows: 3,
  },
  render: ({ disabled, ...args }) => (
    <Row gap="xl">
      <Avatar color="indigo" initials="AI" size="md" />
      <Textarea disabled={disabled} {...args}>
        <TextareaActions>
          <Row full x="between">
            <Button disabled={disabled} plain>
              <PaperClipIcon />
            </Button>

            <Button disabled={disabled} icon size="xl">
              <ArrowUpCircleIcon />
            </Button>
          </Row>
        </TextareaActions>
      </Textarea>
    </Row>
  ),
}

import type { Meta, StoryObj } from '@storybook/react'

import { Column, Row } from '.'
import { CROSS_AXIS, GAPS, ITEMS, MAIN_AXIS } from './constants'

const MAIN_AXIS_OPTIONS = Object.keys(MAIN_AXIS)
const CROSS_AXIS_OPTIONS = Object.keys(CROSS_AXIS)
const ITEMS_OPTIONS = Object.keys(ITEMS)
const GAPS_OPTIONS = Object.keys(GAPS)

const ColumnContent = () => (
  <>
    <div className="bg-gray-800 pl-2 pr-6 text-white">|</div>
    <div className="bg-gray-800 pl-10 pr-4 text-white">|</div>
    <div className="bg-gray-800 pl-6 pr-2 text-white">|</div>
  </>
)

const RowContent = () => (
  <>
    <div className="bg-gray-800 pb-6 pt-2 text-white">__</div>
    <div className="bg-gray-800 pb-4 pt-10 text-white">__</div>
    <div className="bg-gray-800 pb-2 pt-6 text-white">__</div>
  </>
)

/**
 * Axis (Column and Row layout) primitives component used throughout the app.
 */
const meta: Meta<typeof Column> = {
  component: Column,
  argTypes: {
    full: { control: 'boolean' },
    gap: { control: 'select', options: GAPS_OPTIONS },
    items: { control: 'select', options: ITEMS_OPTIONS },
    wrap: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="h-40 w-40 overflow-auto bg-gray-300 sm:h-80 sm:w-80">
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

export const ColumnAxis: StoryObj<typeof Column> = {
  argTypes: {
    ...meta.argTypes,
    x: { control: 'select', options: CROSS_AXIS_OPTIONS },
    y: { control: 'select', options: MAIN_AXIS_OPTIONS },
  },
  args: {
    full: true,
    gap: 'xs',
    items: 'start',
    wrap: true,
    x: 'start',
    y: 'start',
  },
  render: (args) => (
    <Column {...args}>
      <ColumnContent />
      <ColumnContent />
      <ColumnContent />

      <ColumnContent />
      <ColumnContent />
      <ColumnContent />

      <ColumnContent />
      <ColumnContent />
      <ColumnContent />

      <ColumnContent />
      <ColumnContent />
      <ColumnContent />
    </Column>
  ),
}

export const RowAxis: StoryObj<typeof Row> = {
  argTypes: {
    ...meta.argTypes,
    x: { control: 'select', options: MAIN_AXIS_OPTIONS },
    y: { control: 'select', options: CROSS_AXIS_OPTIONS },
  },
  args: {
    full: true,
    gap: 'xs',
    items: 'start',
    wrap: true,
    x: 'start',
    y: 'start',
  },
  render: (args) => (
    <Row {...args}>
      <RowContent />
      <RowContent />
      <RowContent />

      <RowContent />
      <RowContent />
      <RowContent />

      <RowContent />
      <RowContent />
      <RowContent />

      <RowContent />
      <RowContent />
      <RowContent />
    </Row>
  ),
}

import type { Meta, StoryObj } from '@storybook/react'

import { DescriptionDetails, DescriptionList, DescriptionTerm } from '.'

/**
 * Use DescriptionList primitive component to render a list of DescriptionTerm-DescriptionDetails pairs.
 */
const meta: Meta<typeof DescriptionList> = {
  argTypes: {
    children: { control: 'object' },
  },
  component: DescriptionList,
  decorators: [
    (Story) => (
      <div className="min-w-96">
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
  args: {
    children: [
      <DescriptionTerm key="term1">Term 1</DescriptionTerm>,
      <DescriptionDetails key="details1">Details 1</DescriptionDetails>,
      <DescriptionTerm key="term2">Term 2</DescriptionTerm>,
      <DescriptionDetails key="details2">Details 2</DescriptionDetails>,
      <DescriptionTerm key="term3">Term 3</DescriptionTerm>,
      <DescriptionDetails key="details3">Details 3</DescriptionDetails>,
    ],
  },
}

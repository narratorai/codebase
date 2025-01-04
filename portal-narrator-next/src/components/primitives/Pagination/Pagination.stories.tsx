import type { Meta, StoryObj } from '@storybook/react'

import { Pagination, PaginationGap, PaginationList, PaginationNext, PaginationPage, PaginationPrevious } from '.'

const Component = () => (
  <Pagination>
    <PaginationPrevious />
    <PaginationList>
      <PaginationPage current href="?page=1">
        {'1'}
      </PaginationPage>
      <PaginationPage href="?page=2">2</PaginationPage>
      <PaginationPage href="?page=3">3</PaginationPage>
      <PaginationPage href="?page=4">4</PaginationPage>
      <PaginationGap />
      <PaginationPage href="?page=65">65</PaginationPage>
      <PaginationPage href="?page=66">66</PaginationPage>
    </PaginationList>
    <PaginationNext href="?page=2" />
  </Pagination>
)

/**
 * Pagination primitive component used throughout the app.
 */
const meta: Meta<typeof Component> = {
  argTypes: {},
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}

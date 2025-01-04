import type { Meta, StoryObj } from '@storybook/react'
import { Children } from 'react'

import Breadcrumb from './Breadcrumb'
import BreadcrumbContainer from './BreadcrumbContainer'
import BreadcrumbLink from './BreadcrumbLink'

/**
 * Breadcrumb primitive component used throughout the app.
 */
const meta: Meta<typeof BreadcrumbContainer> = {
  args: {
    children: ['Home', 'Users', 'John'],
  },
  component: Breadcrumb,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: ({ children }) => (
    <BreadcrumbContainer>
      {Children.toArray(children).map((child, index) => (
        <Breadcrumb isRoot={index === 0} key={index}>
          {child}
        </Breadcrumb>
      ))}
    </BreadcrumbContainer>
  ),
}

export const WithLinks: Story = {
  render: () => (
    <BreadcrumbContainer>
      <BreadcrumbLink href="#" isRoot>
        Home
      </BreadcrumbLink>
      <BreadcrumbLink href="#/users">Users</BreadcrumbLink>
      <Breadcrumb>John</Breadcrumb>
    </BreadcrumbContainer>
  ),
}

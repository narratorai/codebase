import type { Meta, StoryObj } from '@storybook/react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '.'

const Component = (props: any) => (
  <Table {...props}>
    <TableHead>
      <TableRow>
        <TableHeader>Column A</TableHeader>
        <TableHeader>Column B</TableHeader>
        <TableHeader>Column C</TableHeader>
      </TableRow>
    </TableHead>
    <TableBody>
      <TableRow>
        <TableCell>Cell A1</TableCell>
        <TableCell>Cell B1</TableCell>
        <TableCell>Cell C1</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Cell A2</TableCell>
        <TableCell>Cell B2</TableCell>
        <TableCell>Cell C2</TableCell>
      </TableRow>
      <TableRow>
        <TableCell>Cell A3</TableCell>
        <TableCell>Cell B3</TableCell>
        <TableCell>Cell C3</TableCell>
      </TableRow>
    </TableBody>
  </Table>
)

/**
 * Table primitive component with accessory components used throughout the app.
 */
const meta: Meta<typeof Component> = {
  argTypes: {
    bleed: { control: 'boolean' },
    dense: { control: 'boolean' },
    grid: { control: 'boolean' },
    striped: { control: 'boolean' },
  },
  component: Component,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    bleed: false,
    dense: false,
    grid: false,
    striped: false,
  },
}

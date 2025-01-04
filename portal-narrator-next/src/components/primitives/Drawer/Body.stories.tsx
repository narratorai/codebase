import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Button } from '../Button'
import { Drawer, DrawerBody } from '.'

const Component = (props: any) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} type="button">
        Open Drawer
      </Button>
      <Drawer {...props} onClose={setIsOpen} open={isOpen}>
        <DrawerBody>Drawer body.</DrawerBody>
      </Drawer>
    </>
  )
}

/**
 * Drawer primitive component used throughout the app.
 */
const meta: Meta<typeof Component> = {
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] },
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
    size: 'md',
  },
}

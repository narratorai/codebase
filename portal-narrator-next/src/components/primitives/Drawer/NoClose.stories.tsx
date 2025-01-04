import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Button } from '../Button'
import { Drawer, DrawerActions, DrawerBody, DrawerHeader, DrawerTitle } from '.'

const Component = (props: any) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} type="button">
        Open Drawer
      </Button>
      <Drawer {...props} onClose={setIsOpen} open={isOpen}>
        <DrawerHeader>
          <DrawerTitle>Dialog Title</DrawerTitle>
        </DrawerHeader>

        <DrawerBody>Drawer body.</DrawerBody>
        <DrawerActions>
          <Button onClick={() => setIsOpen(false)} plain>
            Cancel
          </Button>
          <Button autoFocus onClick={() => setIsOpen(false)}>
            Action
          </Button>
        </DrawerActions>
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

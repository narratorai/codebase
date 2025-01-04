import { BuildingOfficeIcon, UserIcon, UsersIcon } from '@heroicons/react/20/solid'
import type { Meta, StoryObj } from '@storybook/react'

import { Tab, TabList, TabPanel, TabPanels, Tabs } from '.'

/**
 * Tabs primitive component with accessory components used throughout the app.
 */
const meta: Meta<typeof Tabs> = {
  component: Tabs,
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

export const WithoutIcons: Story = {
  render: () => (
    <Tabs>
      <TabList>
        <Tab>Tab 1</Tab>
        <Tab>Tab 2</Tab>
        <Tab>Tab 3</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>Tab Panel 1</TabPanel>
        <TabPanel>Tab Panel 2</TabPanel>
        <TabPanel>Tab Panel 3</TabPanel>
      </TabPanels>
    </Tabs>
  ),
}

export const WithIconsBefore: Story = {
  render: () => (
    <Tabs>
      <TabList>
        <Tab>
          <UserIcon /> Tab 1
        </Tab>
        <Tab>
          <BuildingOfficeIcon /> Tab 2
        </Tab>
        <Tab>
          <UsersIcon /> Tab 3
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel>Tab Panel 1</TabPanel>
        <TabPanel>Tab Panel 2</TabPanel>
        <TabPanel>Tab Panel 3</TabPanel>
      </TabPanels>
    </Tabs>
  ),
}

export const WithIconsAfter: Story = {
  render: () => (
    <Tabs>
      <TabList>
        <Tab>
          Tab 1 <UserIcon />
        </Tab>
        <Tab>
          Tab 2 <BuildingOfficeIcon />
        </Tab>
        <Tab>
          Tab 3 <UsersIcon />
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel>Tab Panel 1</TabPanel>
        <TabPanel>Tab Panel 2</TabPanel>
        <TabPanel>Tab Panel 3</TabPanel>
      </TabPanels>
    </Tabs>
  ),
}

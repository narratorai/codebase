import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  LinkIcon,
  NoSymbolIcon,
} from '@heroicons/react/16/solid'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import {
  Dropdown,
  DropdownButton,
  DropdownDescription,
  DropdownDivider,
  DropdownHeader,
  DropdownHeading,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
  DropdownShortcut,
} from '.'

/**
 * Dropdown (menu) primitive component used throughout the app.
 */
const meta: Meta<any> = {
  args: {
    onClick: fn(),
  },
  argTypes: {},
  component: Dropdown,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<any>

export const Basic: Story = {
  render: ({ onClick }: any) => (
    <Dropdown>
      <DropdownButton outline>
        Dropdown Button
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem onClick={() => onClick('regular')}>Regular Item</DropdownItem>
        <DropdownItem href="https://portal.narrator.ai/" target="_blank">
          Link Item
        </DropdownItem>
        <DropdownItem disabled onClick={() => onClick('disabled')}>
          Disabled Item
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  ),
}

export const ButtonStyle: any = {
  args: {
    color: 'indigo',
    disabled: false,
    outline: false,
    plain: false,
  },
  argTypes: {
    color: {
      control: 'select',
      options: [
        'dark/zinc',
        'light',
        'dark/white',
        'dark',
        'zinc',
        'white',
        'red',
        'orange',
        'amber',
        'yellow',
        'lime',
        'green',
        'emerald',
        'teal',
        'cyan',
        'sky',
        'blue',
        'indigo',
        'violet',
        'purple',
        'fuchsia',
        'pink',
        'rose',
      ],
    },
    disabled: { control: 'boolean' },
    outline: { control: 'boolean' },
    plain: { control: 'boolean' },
  },
  render: ({ color, disabled, onClick, outline, plain }: any) => (
    <Dropdown>
      <DropdownButton color={color} disabled={disabled} outline={outline} plain={plain}>
        Colored Button
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem onClick={() => onClick('regular')}>Regular Item</DropdownItem>
        <DropdownItem href="https://portal.narrator.ai/" target="_blank">
          Link Item
        </DropdownItem>
        <DropdownItem disabled onClick={() => onClick('disabled')}>
          Disabled Item
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  ),
}

export const WithHeader: Story = {
  render: ({ onClick }: any) => (
    <Dropdown>
      <DropdownButton outline>
        Dropdown Button
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu>
        <DropdownHeader>
          <div className="pr-6">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Header Title</div>
            <div className="text-sm/7 font-semibold text-zinc-800 dark:text-white">Header</div>
          </div>
        </DropdownHeader>
        <DropdownDivider />
        <DropdownItem onClick={() => onClick('regular')}>Regular Item</DropdownItem>
        <DropdownItem href="https://portal.narrator.ai/" target="_blank">
          Link Item
        </DropdownItem>
        <DropdownItem disabled onClick={() => onClick('disabled')}>
          Disabled Item
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  ),
}

export const WithIconButton: Story = {
  render: ({ onClick }: any) => (
    <Dropdown>
      <DropdownButton aria-label="Dropdown Button" plain>
        <EllipsisVerticalIcon />
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem onClick={() => onClick('regular')}>Regular Item</DropdownItem>
        <DropdownItem href="https://portal.narrator.ai/" target="_blank">
          Link Item
        </DropdownItem>
        <DropdownItem disabled onClick={() => onClick('disabled')}>
          Disabled Item
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  ),
}

export const WithIcons: Story = {
  render: ({ onClick }: any) => (
    <Dropdown>
      <DropdownButton outline>
        Dropdown Button
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem onClick={() => onClick('regular')}>
          <InformationCircleIcon />
          <DropdownLabel>Regular Item</DropdownLabel>
        </DropdownItem>
        <DropdownItem href="https://portal.narrator.ai/" target="_blank">
          <LinkIcon />
          <DropdownLabel>Link Item</DropdownLabel>
        </DropdownItem>
        <DropdownItem disabled onClick={() => onClick('disabled')}>
          <NoSymbolIcon />
          <DropdownLabel>Disabled Item</DropdownLabel>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  ),
}

export const WithLabelsAndDescriptions: Story = {
  render: ({ onClick }: any) => (
    <Dropdown>
      <DropdownButton outline>
        Dropdown Button
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem onClick={() => onClick('regular')}>
          <DropdownLabel>Regular Item Label</DropdownLabel>
          <DropdownDescription>Regular Item Description</DropdownDescription>
        </DropdownItem>
        <DropdownItem href="https://portal.narrator.ai/" target="_blank">
          <DropdownLabel>Link Item Label</DropdownLabel>
          <DropdownDescription>Link Item Description</DropdownDescription>
        </DropdownItem>
        <DropdownItem disabled onClick={() => onClick('disabled')}>
          <DropdownLabel>Disabled Item Label</DropdownLabel>
          <DropdownDescription>Disabled Item Description</DropdownDescription>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  ),
}

export const WithLongLabelsAndDescriptions: Story = {
  render: ({ onClick }: any) => (
    <Dropdown>
      <DropdownButton outline>
        Dropdown Button
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem onClick={() => onClick('regular')}>
          <DropdownLabel>
            Regular "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
            et dolore magna aliqua."
          </DropdownLabel>
          <DropdownDescription>
            Regular "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
            et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
            ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
            mollit anim id est laborum."
          </DropdownDescription>
        </DropdownItem>
        <DropdownItem href="https://portal.narrator.ai/" target="_blank">
          <DropdownLabel>
            Link "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua."
          </DropdownLabel>
          <DropdownDescription>
            Link "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum."
          </DropdownDescription>
        </DropdownItem>
        <DropdownItem disabled onClick={() => onClick('disabled')}>
          <DropdownLabel>
            Disabled "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua."
          </DropdownLabel>
          <DropdownDescription>
            Disabled "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
            labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
            dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
            deserunt mollit anim id est laborum."
          </DropdownDescription>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  ),
}

export const MenuPlacement: Story = {
  args: {
    anchor: 'right end',
  },
  argTypes: {
    anchor: { control: 'text' },
  },
  render: ({ anchor, onClick }: any) => (
    <Dropdown>
      <DropdownButton outline>
        Dropdown Button
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu anchor={anchor}>
        <DropdownItem onClick={() => onClick('regular')}>Regular Item</DropdownItem>
        <DropdownItem href="https://portal.narrator.ai/" target="_blank">
          Link Item
        </DropdownItem>
        <DropdownItem disabled onClick={() => onClick('disabled')}>
          Disabled Item
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  ),
}

export const WithSectionsAndHeadings: Story = {
  render: ({ onClick }: any) => (
    <Dropdown>
      <DropdownButton outline>
        Dropdown Button
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu>
        <DropdownSection>
          <DropdownItem onClick={() => onClick('section-1-regular')}>Section 1 Regular Item</DropdownItem>
          <DropdownItem href="https://portal.narrator.ai/" target="_blank">
            Section 1 Link Item
          </DropdownItem>
          <DropdownItem disabled onClick={() => onClick('section-1-disabled')}>
            Section 1 Disabled Item
          </DropdownItem>
        </DropdownSection>
        <DropdownDivider />
        <DropdownSection>
          <DropdownHeading>Section 2 Heading</DropdownHeading>
          <DropdownItem onClick={() => onClick('section-2-regular')}>Section 2 Regular Item</DropdownItem>
          <DropdownItem href="https://portal.narrator.ai/" target="_blank">
            Section 2 Link Item
          </DropdownItem>
          <DropdownItem disabled onClick={() => onClick('section-2-disabled')}>
            Section 2 Disabled Item
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  ),
}

export const WithShortcuts: Story = {
  render: ({ onClick }: any) => (
    <Dropdown>
      <DropdownButton outline>
        Dropdown Button
        <ChevronDownIcon />
      </DropdownButton>
      <DropdownMenu>
        <DropdownItem onClick={() => onClick('regular')}>
          <DropdownLabel>Regular Item</DropdownLabel>
          <DropdownShortcut keys="⌘K" />
        </DropdownItem>
        <DropdownItem href="https://portal.narrator.ai/" target="_blank">
          <DropdownLabel>Link Item</DropdownLabel>
          <DropdownShortcut keys="⌘L" />
        </DropdownItem>
        <DropdownItem disabled onClick={() => onClick('disabled')}>
          <DropdownLabel>Disabled Item</DropdownLabel>
          <DropdownShortcut keys="⌘D" />
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  ),
}

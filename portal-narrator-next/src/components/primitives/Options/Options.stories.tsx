import { CursorArrowRippleIcon, InformationCircleIcon, LinkIcon } from '@heroicons/react/16/solid'
import { CheckIcon } from '@heroicons/react/24/outline'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import {
  ButtonOption,
  LinkOption,
  Option,
  OptionContents,
  OptionDescription,
  OptionDivider,
  OptionHeader,
  OptionHeading,
  OptionLabel,
  Options,
  OptionSection,
  OptionSeparator,
  OptionShortcut,
} from '.'

interface Props {
  onClick: (value: any) => void
}

/**
 * Options selection list primitive component used in components with selection lists (e.g., Dropdown, Listbox, Combobox, etc...).
 */
const meta: Meta<typeof Options> = {
  args: {
    onClick: fn(),
  },
  component: Options,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<Props>

export const Basic: Story = {
  render: ({ onClick }) => (
    <Options>
      <Option data-focus>
        <OptionContents>Regular Option (focused)</OptionContents>
      </Option>
      <LinkOption href="https://portal.narrator.ai/" target="_blank">
        <OptionContents>Link Option</OptionContents>
      </LinkOption>
      <ButtonOption onClick={() => onClick('button')}>
        <OptionContents>Button Option</OptionContents>
      </ButtonOption>
    </Options>
  ),
}

export const WithHeader: Story = {
  render: ({ onClick }) => (
    <Options>
      <OptionHeader>
        <div className="pr-6">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Header Title</div>
          <div className="text-sm/7 font-semibold text-zinc-800 dark:text-white">Header</div>
        </div>
      </OptionHeader>
      <OptionSeparator />
      <Option data-focus>
        <OptionContents>Regular Option (focused)</OptionContents>
      </Option>
      <LinkOption href="https://portal.narrator.ai/" target="_blank">
        <OptionContents>Link Option</OptionContents>
      </LinkOption>
      <ButtonOption onClick={() => onClick('button')}>
        <OptionContents>Button Option</OptionContents>
      </ButtonOption>
    </Options>
  ),
}

export const WithIcons: Story = {
  render: ({ onClick }) => (
    <Options>
      <Option data-focus>
        <OptionContents>
          <InformationCircleIcon />
          <OptionLabel>Regular Option (focused)</OptionLabel>
        </OptionContents>
      </Option>
      <LinkOption href="https://portal.narrator.ai/" target="_blank">
        <OptionContents>
          <LinkIcon />
          <OptionLabel>Link Option</OptionLabel>
        </OptionContents>
      </LinkOption>
      <ButtonOption onClick={() => onClick('button')}>
        <OptionContents>
          <CursorArrowRippleIcon />
          <OptionLabel>Button Option</OptionLabel>
        </OptionContents>
      </ButtonOption>
    </Options>
  ),
}

export const WithLabelsAndDescriptions: Story = {
  render: ({ onClick }) => (
    <Options>
      <Option data-focus>
        <OptionContents>
          <OptionLabel>Regular Option (focused)</OptionLabel>
          <OptionDescription>Regular Description (focused)</OptionDescription>
        </OptionContents>
      </Option>
      <LinkOption href="https://portal.narrator.ai/" target="_blank">
        <OptionContents>
          <OptionLabel>Link Option</OptionLabel>
          <OptionDescription>Link Description</OptionDescription>
        </OptionContents>
      </LinkOption>
      <ButtonOption onClick={() => onClick('button')}>
        <OptionContents>
          <OptionLabel>Button Option</OptionLabel>
          <OptionDescription>Button Description</OptionDescription>
        </OptionContents>
      </ButtonOption>
    </Options>
  ),
}

export const WithSectionsAndHeadings: Story = {
  render: ({ onClick }) => (
    <Options>
      <OptionSection>
        <Option data-focus>
          <OptionContents>Section 1 Regular Option (focused)</OptionContents>
        </Option>
        <LinkOption href="https://portal.narrator.ai/" target="_blank">
          <OptionContents>Section 1 Link Option</OptionContents>
        </LinkOption>
        <ButtonOption onClick={() => onClick('button 1')}>
          <OptionContents>Section 1 Button Option</OptionContents>
        </ButtonOption>
      </OptionSection>
      <OptionSeparator />
      <OptionSection>
        <OptionHeading>Section 2 Heading</OptionHeading>
        <Option>
          <OptionContents>Section 2 Regular Option</OptionContents>
        </Option>
        <LinkOption href="https://portal.narrator.ai/" target="_blank">
          <OptionContents>Section 2 Link Option</OptionContents>
        </LinkOption>
        <ButtonOption onClick={() => onClick('button 2')}>
          <OptionContents>Section 2 Button Option</OptionContents>
        </ButtonOption>
      </OptionSection>
    </Options>
  ),
}

export const WithSelection: Story = {
  render: () => (
    <Options>
      <Option data-focus>
        <OptionContents>
          <OptionLabel>Regular Option (focused)</OptionLabel>
          <CheckIcon data-slot="selection" />
        </OptionContents>
      </Option>
      <Option data-selected>
        <OptionContents>
          <OptionLabel>Regular Option (selected)</OptionLabel>
          <CheckIcon data-slot="selection" />
        </OptionContents>
      </Option>
      <Option>
        <OptionContents>
          <OptionLabel>Regular Option</OptionLabel>
          <CheckIcon data-slot="selection" />
        </OptionContents>
      </Option>
    </Options>
  ),
}

export const WithShortcuts: Story = {
  render: ({ onClick }) => (
    <Options>
      <Option data-focus>
        <OptionContents>
          <OptionLabel>Regular Option (focused)</OptionLabel>
          <OptionShortcut keys="⌘R" />
        </OptionContents>
      </Option>
      <LinkOption href="https://portal.narrator.ai/" target="_blank">
        <OptionContents>
          <OptionLabel>Link Option</OptionLabel>
          <OptionShortcut keys="⌘L" />
        </OptionContents>
      </LinkOption>
      <ButtonOption onClick={() => onClick('button')}>
        <OptionContents>
          <OptionLabel>Button Option</OptionLabel>
          <OptionShortcut keys="⌘B" />
        </OptionContents>
      </ButtonOption>
    </Options>
  ),
}

export const WithDividers: Story = {
  render: ({ onClick }) => (
    <Options>
      <Option data-focus>
        <OptionContents>
          <OptionLabel>Regular Option (focused)</OptionLabel>
          <OptionDescription>Regular Description (focused)</OptionDescription>
        </OptionContents>
        <OptionDivider />
      </Option>
      <LinkOption href="https://portal.narrator.ai/" target="_blank">
        <OptionContents>
          <OptionLabel>Link Option</OptionLabel>
          <OptionDescription>Link Description</OptionDescription>
        </OptionContents>
        <OptionDivider />
      </LinkOption>
      <ButtonOption onClick={() => onClick('button')}>
        <OptionContents>
          <OptionLabel>Button Option</OptionLabel>
          <OptionDescription>Button Description</OptionDescription>
        </OptionContents>
      </ButtonOption>
    </Options>
  ),
}

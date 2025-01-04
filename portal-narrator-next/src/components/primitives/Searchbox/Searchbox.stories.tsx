import { Provider } from '@radix-ui/react-tooltip'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { useState } from 'react'

import { Button } from '../Button'
import EmptyState from '../EmptyState'
import { Searchbox, SearchboxItems } from '.'
import SearchboxItemTemplate, { SearchboxItemTemplateProps } from './SearchboxItemTemplate'

const SearchboxDialog = ({ isLoading, items, multiple, onChange, onClose, onScroll, open }: any) => {
  const [query, setQuery] = useState('')

  const filteredItems =
    query === ''
      ? items
      : items.filter((item: any) => {
          return item.name.toLowerCase().includes(query.toLowerCase())
        })

  const searchbox = {
    multiple,
    onChange,
    virtual: { options: filteredItems },
  }

  const searchboxDialog = {
    onClose,
    open,
  }

  const searchboxInputProps = {
    autoFocus: true,
    onBlur: () => setQuery(''),
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value),
    placeholder: 'Search...',
  }

  const isEmpty = query !== '' && filteredItems.length === 0

  return (
    <Provider>
      <Searchbox<SearchboxItemTemplateProps | SearchboxItemTemplateProps[]>
        searchboxDialogProps={searchboxDialog}
        searchboxInputProps={searchboxInputProps}
        searchboxProps={searchbox}
      >
        {!isEmpty && (
          <SearchboxItems isLoading={isLoading} onScroll={onScroll} OptionTemplate={SearchboxItemTemplate} />
        )}
        {isEmpty && (
          <EmptyState
            description="No components found for this search term. Please try again."
            title="No results found"
          />
        )}
      </Searchbox>
    </Provider>
  )
}

const Component = ({ isLoading, items, multiple, onChange, onScroll }: any) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} outline>
        Open Searchbox
      </Button>
      <SearchboxDialog
        isLoading={isLoading}
        items={items}
        multiple={multiple}
        onChange={onChange}
        onClose={() => setIsOpen(false)}
        onScroll={onScroll}
        open={isOpen}
      />
    </>
  )
}

const items = [
  {
    category: 'Content',
    color: 'pink',
    createdAt: '3 days ago',
    description: 'Add freeform text with basic formatting options.',
    everyone: false,
    favorited: true,
    icon: 'OutlinePencilSquareIcon',
    id: 1,
    name: 'Text',
    tags: ['Blog', 'Document'],
    teams: ['AI', 'BI', 'CI'],
    url: '#',
  },
  {
    category: 'Content',
    color: 'pink',
    createdAt: '3 days ago',
    description: 'Add a video from YouTube, Vimeo or other service.',
    everyone: false,
    favorited: true,
    icon: 'OutlineVideoCameraIcon',
    id: 2,
    name: 'Video',
    tags: ['Youtube', 'Vimeo', 'Streaming'],
    teams: [
      'AI',
      'BI',
      'CI',
      'DI',
      'EI',
      'FI',
      'GI',
      'HI',
      'II',
      'JI',
      'KI',
      'LI',
      'MI',
      'NI',
      'OI',
      'PI',
      'QI',
      'RI',
      'SI',
      'TI',
    ],
    url: '#',
  },
  {
    category: 'Structure',
    color: 'purple',
    createdAt: '3 days ago',
    description: 'Add a new blank page to your project.',
    everyone: true,
    favorited: true,
    icon: 'OutlineDocumentIcon',
    id: 3,
    name: 'Page',
    tags: ['HTML', 'Formatting'],
    teams: ['AI', 'BI', 'CI'],
    url: '#',
  },
  {
    category: 'Data',
    color: 'blue',
    createdAt: '3 days ago',
    description: 'Add a full month calendar or a week view calendar.',
    everyone: false,
    favorited: false,
    icon: 'OutlineCalendarIcon',
    id: 4,
    name: 'Calendar',
    tags: ['Date', 'Week', 'Month', 'Year'],
    url: '#',
  },
  {
    category: 'Data',
    color: 'blue',
    createdAt: '3 days ago',
    description: 'Add a table for displaying larger sets of data.',
    everyone: false,
    favorited: false,
    icon: 'OutlineTableCellsIcon',
    id: 5,
    name: 'Table',
    tags: ['Sheet', 'CSV'],
    url: '#',
  },
  {
    category: 'Content',
    color: 'pink',
    createdAt: '3 days ago',
    description: 'Add a raw HTML, JavaScript or CSS code.',
    everyone: false,
    favorited: false,
    icon: 'OutlineCodeBracketIcon',
    id: 6,
    name: 'Code',
    url: '#',
  },
  {
    category: 'Content',
    color: 'pink',
    createdAt: '3 days ago',
    description: 'Add a simple image or a photo galery.',
    everyone: false,
    favorited: false,
    icon: 'OutlinePhotoIcon',
    id: 7,
    name: 'Image',
    tags: ['Photo', 'Drawing'],
    url: '#',
  },
  {
    category: 'Data',
    color: 'blue',
    createdAt: '3 days ago',
    description: 'Add an ordered or an unordered list.',
    everyone: false,
    favorited: false,
    icon: 'OutlineBars4Icon',
    id: 8,
    name: 'List',
    url: '#',
  },
  {
    category: 'Interactive',
    color: 'red',
    createdAt: '3 days ago',
    description: 'Add a link to another page, website, or email address.',
    everyone: false,
    favorited: false,
    icon: 'OutlineLinkIcon',
    id: 9,
    name: 'Link',
    url: '#',
  },
  {
    category: 'Structure',
    color: 'purple',
    createdAt: '3 days ago',
    description: 'Add a kanban style board with cards and columns.',
    everyone: false,
    favorited: false,
    icon: 'OutlineViewColumnsIcon',
    id: 10,
    name: 'Board',
    url: '#',
  },
]

/**
 * Searchbox primitive component used throughout the app.
 */
const meta: Meta<typeof Component> = {
  args: {
    items,
    onChange: fn(),
    onScroll: fn(),
  },
  argTypes: {
    isLoading: { control: 'boolean' },
    items: { control: 'object' },
    multiple: { control: 'boolean' },
  },
  component: Component,
  // parameters: {
  //   layout: 'centered',
  // },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isLoading: false,
    multiple: false,
  },
}

import { find } from 'lodash'
import { useRef } from 'react'

import { MultiSelect, MultiSelectContent, MultiSelectDefaultTrigger } from '@/components/shared/MultiSelect'
import { useActivities } from '@/stores/activities'

import { useSearchCommand, useSearchQuery } from './hooks'
import SearchInput from './SearchInput'
import SearchTotalCount from './SearchTotalCount'
import SelectionList from './SelectionList'

interface Props {
  onValueChange?: (items: string[]) => void
}

const ActivitySelect = ({ onValueChange }: Props) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const items = useActivities((state) => state.data)
  const { isFetching, setSearch } = useSearchQuery()
  const { isOpen, setIsOpen } = useSearchCommand()

  const getItemName = (id: string) => {
    const item = find(items, (item) => item.id === id)
    return item?.name || id
  }

  const focusSearchInput = () => {
    setSearch('')
    searchRef.current?.focus()
  }

  return (
    <MultiSelect isOpen={isOpen} multiselect="optional" onValueChange={onValueChange} setIsOpen={setIsOpen}>
      <MultiSelectDefaultTrigger placeholder="Select activities" tagColor="purple" valueFormatter={getItemName} />
      <MultiSelectContent collisionPadding={152} onOpenAutoFocus={focusSearchInput}>
        <div className="border-gray-100 p-4">
          <SearchInput isFetching={isFetching} onSearch={setSearch} ref={searchRef} />
        </div>
        <hr />
        <div className="pl-4 pr-1.5">
          <SelectionList />
        </div>
        <hr />
        <div className="p-4">
          <SearchTotalCount isFetching={isFetching} />
        </div>
      </MultiSelectContent>
    </MultiSelect>
  )
}

export default ActivitySelect

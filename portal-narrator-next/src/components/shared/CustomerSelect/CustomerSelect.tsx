import { find } from 'lodash'
import { useRef } from 'react'

import { MultiSelect, MultiSelectContent, MultiSelectDefaultTrigger } from '@/components/shared/MultiSelect'
import { useJourneyActivities } from '@/stores/journeys'

import { useSearchCommand, useSearchQuery } from './hooks'
import SearchInput from './SearchInput'
import SearchTotalCount from './SearchTotalCount'
import SelectionList from './SelectionList'

interface Props {
  onValueChange?: (items: string[]) => void
}

const CustomerSelect = ({ onValueChange }: Props) => {
  const searchRef = useRef<HTMLInputElement>(null)
  const items = useJourneyActivities((state) => state.data)
  const { isFetching, setSearch } = useSearchQuery()
  const { isOpen, setIsOpen } = useSearchCommand()

  const getItemName = (customer: string) => {
    const item = find(items, (item) => item.customer === customer)
    return item?.customerDisplayName || customer
  }

  const focusSearchInput = () => {
    setSearch('')
    searchRef.current?.focus()
  }

  return (
    <MultiSelect isOpen={isOpen} multiselect="none" onValueChange={onValueChange} setIsOpen={setIsOpen}>
      <MultiSelectDefaultTrigger placeholder="Select customer" tagColor="transparent" valueFormatter={getItemName} />
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

export default CustomerSelect

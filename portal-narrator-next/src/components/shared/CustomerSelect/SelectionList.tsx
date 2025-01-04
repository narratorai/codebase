import { map } from 'lodash'

import Loading from '@/components/shared/Loading'
import { ContentScrollArea, Item } from '@/components/shared/MultiSelect'
import { useScrollEvents } from '@/hooks'
import { useJourneyActivities } from '@/stores/journeys'

import { useCustomerJourneyQuery } from './hooks'
import SelectionListItem from './SelectionListItem'

const SelectionList = () => {
  const items = useJourneyActivities((state) => state.data)
  const { fetchNextPage, isFetchingNextPage } = useCustomerJourneyQuery()

  const handleScrollEnd = () => {
    if (!isFetchingNextPage) fetchNextPage()
  }

  const handleScroll = useScrollEvents(handleScrollEnd)

  return (
    <ContentScrollArea className="flex flex-col gap-6 py-6 pr-2.5" onScroll={handleScroll}>
      {map(items, (item) => (
        <Item key={item.customer} value={item.customer}>
          <SelectionListItem item={item} />
        </Item>
      ))}
      {isFetchingNextPage && (
        <div className="h-24 w-[512px] pt-4">
          <Loading className="h-12 w-16" />
        </div>
      )}
    </ContentScrollArea>
  )
}

export default SelectionList

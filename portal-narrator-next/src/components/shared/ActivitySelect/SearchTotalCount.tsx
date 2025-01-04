import Spin from '@/components/shared/Spin'
import { useActivities } from '@/stores/activities'

interface Props {
  isFetching: boolean
}

const SearchTotalCount = ({ isFetching }: Props) => {
  const totalCount = useActivities((state) => state.totalCount)

  return (
    <div className="h-6 gap-4 flex-x-center">
      <span className="text-base font-medium text-gray-600">Search total count:</span>
      <div className="badge badge-md tonal gray">
        {!isFetching && <span className="badge-label">{totalCount}</span>}
        {isFetching && <Spin className="badge-icon" />}
      </div>
    </div>
  )
}

export default SearchTotalCount

import { Row } from '@/components/primitives/Axis'
import { Badge } from '@/components/primitives/Badge'
import { Frame } from '@/components/primitives/Frame'
import Loading from '@/components/primitives/Loading'
import { SearchboxItemText } from '@/components/primitives/Searchbox'

interface Props {
  isFetching: boolean
  totalCount: number
}

const SearchTotalCount = ({ isFetching, totalCount }: Props) => (
  <Frame x="3xl" y="lg">
    <Row gap="md" items="center">
      <SearchboxItemText>Search total count:</SearchboxItemText>

      {isFetching ? (
        <Badge color="transparent" pill size="sm">
          <Loading size="2xs" />
        </Badge>
      ) : (
        <Badge color="indigo" pill size="sm" soft>
          {totalCount}
        </Badge>
      )}
    </Row>
  </Frame>
)

export default SearchTotalCount

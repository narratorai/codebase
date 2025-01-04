import { Avatar } from '@/components/primitives/Avatar'
import { Tooltip } from '@/components/primitives/Tooltip'

type Props = {
  favorited: boolean
}

const DatasetCollectionItemFavorited = ({ favorited }: Props) =>
  favorited && (
    <Tooltip content={{ sideOffset: 4 }} showArrow tip="Favorited">
      <Avatar color="amber" icon="SolidBookmarkIcon" size="xs" />
    </Tooltip>
  )

export default DatasetCollectionItemFavorited

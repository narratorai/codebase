import { SearchboxItemText } from '@/components/primitives/Searchbox'
import { Tooltip } from '@/components/primitives/Tooltip'

type Props = {
  description: string | null
}

const DatasetCollectionItemDescription = ({ description }: Props) =>
  description && (
    <Tooltip showArrow tip={description}>
      <SearchboxItemText truncate>{description}</SearchboxItemText>
    </Tooltip>
  )

export default DatasetCollectionItemDescription

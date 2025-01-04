import { SearchboxItemText } from '@/components/primitives/Searchbox'
import { Tooltip } from '@/components/primitives/Tooltip'
import { useCompany } from '@/stores/companies'
import { formatDistanceToNow, formatShortDateTime } from '@/util/formatters'

type Props = {
  lastViewedAt: string | null
}

const DatasetCollectionItemLastViewed = ({ lastViewedAt }: Props) => {
  const company = useCompany()

  if (!lastViewedAt) return <SearchboxItemText>Never viewed</SearchboxItemText>

  const timeDistance = formatDistanceToNow(lastViewedAt, company)
  const date = formatShortDateTime(lastViewedAt, company)

  return (
    <Tooltip showArrow tip={`Viewed at: ${date}`}>
      <SearchboxItemText>{timeDistance}</SearchboxItemText>
    </Tooltip>
  )
}

export default DatasetCollectionItemLastViewed

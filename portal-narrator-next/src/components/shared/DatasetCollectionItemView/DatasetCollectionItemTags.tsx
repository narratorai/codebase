import { filter, join, map, slice } from 'lodash'

import { Row } from '@/components/primitives/Axis'
import { Badge } from '@/components/primitives/Badge'
import { Tooltip } from '@/components/primitives/Tooltip'
import { useCompany } from '@/stores/companies'

type Props = {
  tagIds: string[]
}

const DatasetCollectionItemTags = ({ tagIds }: Props) => {
  const company = useCompany()
  const tagIdsSet = new Set(tagIds)
  const tags = filter(company.tags, (tag) => tagIdsSet.has(tag.id))
  const hasTags = tags.length > 0
  const hasMoreTags = tags.length > 3
  const tagsNames = map(tags, 'tag')
  const tagsNamesJoined = `Tags: ${join(tagsNames, ', ')}.`
  const firstThreeTags = slice(tags, 0, 3)

  return (
    hasTags && (
      <Tooltip showArrow tip={tagsNamesJoined}>
        <Row gap="sm" items="center">
          {map(firstThreeTags, (item) => (
            <Badge color={item.color} key={item.id} size="sm" soft>
              {item.tag}
            </Badge>
          ))}
          {hasMoreTags && (
            <Badge color="indigo" size="sm" soft>
              3+
            </Badge>
          )}
        </Row>
      </Tooltip>
    )
  )
}

export default DatasetCollectionItemTags

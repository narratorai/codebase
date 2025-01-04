import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { filter, includes } from 'lodash'
import { useContext } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { makeActivityName } from 'util/datasets'
import { IDefinitionRelativeActivityFilter } from 'util/datasets/interfaces'

import RelativeActivityFilter from './RelativeActivityFilter'

interface Props {
  parentFieldName: string
  isViewMode?: boolean
}

const RelativeActivityFilters = ({ parentFieldName, isViewMode }: Props) => {
  const { watch, control } = useFormContext()
  const appendActivityIds = watch(`${parentFieldName}.activity_ids`)

  const { remove: removeActivityFilter } = useFieldArray({
    control,
    name: `${parentFieldName}.relative_activity_filters`,
  })

  const relativeActivityValues = watch(`${parentFieldName}.relative_activity_filters`)

  const { streamActivities } = useContext(DatasetFormContext)
  const appendActivities = filter(streamActivities, (activity) => includes(appendActivityIds, activity.id))

  // per https://github.com/react-hook-form/react-hook-form/issues/1564#issuecomment-875566912
  // map over values - rather than fields to avoid outdated state
  return relativeActivityValues?.map((_: IDefinitionRelativeActivityFilter, index: number) => (
    <RelativeActivityFilter
      key={index}
      control={control}
      appendActivityName={makeActivityName(appendActivities)}
      fieldName={`${parentFieldName}.relative_activity_filters.${index}`}
      onRemove={() => removeActivityFilter(index)}
      isViewMode={isViewMode}
    />
  ))
}

export default RelativeActivityFilters

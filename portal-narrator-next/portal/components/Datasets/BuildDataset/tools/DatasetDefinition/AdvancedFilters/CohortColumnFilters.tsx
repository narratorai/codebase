import DatasetDefinitionContext from 'components/Datasets/BuildDataset/tools/DatasetDefinition/DatasetDefinitionContext'
import { IDatasetDefinitionContext } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/interfaces'
import { IActivity } from 'graph/generated'
import { filter, find, includes } from 'lodash'
import { useContext } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { makeActivityName } from 'util/datasets'
import { IActivityColumnOptions, IDefinitionCohortColumnFilter } from 'util/datasets/interfaces'

import CohortColumnFilter from './CohortColumnFilter'

interface Props {
  parentFieldName: string
  isViewMode?: boolean
}

const CohortColumnFilters = ({ parentFieldName, isViewMode }: Props) => {
  const { watch, control } = useFormContext()
  const appendActivityIds = watch(`${parentFieldName}.activity_ids`)
  const relationshipSlug = watch(`${parentFieldName}.relationship_slug`)

  const { machineCurrent, streamActivities } = useContext<IDatasetDefinitionContext>(DatasetDefinitionContext)
  const { _definition_context: definitionContext } = machineCurrent.context

  const cohortActivityIds = definitionContext?.form_value?.cohort?.activity_ids

  const appendColumns =
    find(definitionContext.column_options, {
      activity_ids: appendActivityIds,
      relationship_slug: relationshipSlug || null,
    }) || ({} as IActivityColumnOptions)

  const cohortColumns =
    find(definitionContext.column_options, {
      activity_ids: cohortActivityIds,
      relationship_slug: null,
    }) || ({} as IActivityColumnOptions)

  const { remove: removeCohortColumnFilter } = useFieldArray({
    control,
    name: `${parentFieldName}.cohort_column_filters`,
  })

  const cohortColumnFiltersValues = watch(`${parentFieldName}.cohort_column_filters`)

  const cohortActivities = filter(streamActivities, (activity) =>
    includes(cohortActivityIds, activity.id)
  ) as IActivity[]
  const appendActivities = filter(streamActivities, (activity) =>
    includes(appendActivityIds, activity.id)
  ) as IActivity[]

  const cohortActivityName = makeActivityName(cohortActivities)
  const appendActivityName = makeActivityName(appendActivities)

  // per https://github.com/react-hook-form/react-hook-form/issues/1564#issuecomment-875566912
  // map over values - rather than fields to avoid outdated state
  return cohortColumnFiltersValues?.map((_: IDefinitionCohortColumnFilter, index: number) => {
    const fieldName = `${parentFieldName}.cohort_column_filters.${index}`

    return (
      <CohortColumnFilter
        key={fieldName}
        fieldName={fieldName}
        appendColumns={appendColumns}
        cohortColumns={cohortColumns}
        cohortActivityName={cohortActivityName}
        appendActivityName={appendActivityName}
        removeCohortColumnFilter={removeCohortColumnFilter}
        index={index}
        isViewMode={isViewMode}
      />
    )
  })
}

export default CohortColumnFilters

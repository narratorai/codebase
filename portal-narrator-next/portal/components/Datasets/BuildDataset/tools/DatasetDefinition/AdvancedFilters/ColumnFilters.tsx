import DatasetDefinitionContext from 'components/Datasets/BuildDataset/tools/DatasetDefinition/DatasetDefinitionContext'
import { IDatasetDefinitionContext } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/interfaces'
import { find, groupBy, keys } from 'lodash'
import { useContext } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { IActivityColumnOptions, IDatasetDefinitionColumn, IDefinitionColumnFilter } from 'util/datasets/interfaces'

import ColumnFilter from './ColumnFilter'

interface Props {
  parentFieldName: string
  isViewMode?: boolean
}

const ColumnFilters = ({ parentFieldName, isViewMode }: Props) => {
  const { watch, control } = useFormContext()
  const isCohort = parentFieldName === 'cohort'
  const activityIds = watch(`${parentFieldName}.activity_ids`)
  const relationshipSlug = watch(`${parentFieldName}.relationship_slug`)

  const { machineCurrent } = useContext<IDatasetDefinitionContext>(DatasetDefinitionContext)
  const { _definition_context: definitionContext } = machineCurrent.context

  const columnOptions = isCohort
    ? find(definitionContext.column_options, ['activity_ids', activityIds]) || ({} as IActivityColumnOptions)
    : find(definitionContext.column_options, {
        activity_ids: activityIds,
        relationship_slug: relationshipSlug || null,
      }) || ({} as IActivityColumnOptions)

  const filterColumnOptions: IDatasetDefinitionColumn[] = columnOptions.filter_options

  const showGroupedOptions = keys(groupBy(filterColumnOptions, (col) => col.opt_group || 'Other')).length > 0

  const { remove: removeColumnFilter } = useFieldArray({
    control,
    name: `${parentFieldName}.column_filters`,
  })

  const columnFiltersValues = watch(`${parentFieldName}.column_filters`)

  // per https://github.com/react-hook-form/react-hook-form/issues/1564#issuecomment-875566912
  // map over values - rather than fields to avoid outdated state
  return columnFiltersValues?.map((_: IDefinitionColumnFilter, index: number) => {
    const fieldName = `${parentFieldName}.column_filters.${index}`

    return (
      <ColumnFilter
        key={fieldName}
        fieldName={fieldName}
        filterColumnOptions={filterColumnOptions}
        isGrouped={showGroupedOptions}
        removeColumnFilter={removeColumnFilter}
        index={index}
        isViewMode={isViewMode}
      />
    )
  })
}

export default ColumnFilters

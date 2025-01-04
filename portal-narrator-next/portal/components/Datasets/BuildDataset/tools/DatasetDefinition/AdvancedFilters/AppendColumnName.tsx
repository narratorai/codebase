import { SearchSelect } from 'components/antd/staged'
import { handleCreateOptionContent } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/AdvancedFilters/ColumnFilterInputs'
import { find, groupBy, isEqual, keys, map } from 'lodash'
import { useCallback, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { IActivityColumnOptions } from 'util/datasets/interfaces'
import { required } from 'util/forms'

interface Props {
  fieldName: string
  appendColumns?: IActivityColumnOptions
  cohortColumns?: IActivityColumnOptions
}

const AppendColumnName = ({ fieldName, appendColumns, cohortColumns }: Props) => {
  const { watch, setValue, control } = useFormContext()

  const appendColumnName = watch(`${fieldName}.append_column_name`)
  const enrichmentTableValue = watch(`${fieldName}.column_name_enrichment_table`)

  const onChangeEnrichmentTable = useCallback(
    (enrichmentTable?: string | null) => {
      setValue(`${fieldName}.column_name_enrichment_table`, enrichmentTable, { shouldValidate: true })
    },
    [setValue, fieldName]
  )

  const selectedCohortColumnName = watch(`${fieldName}.cohort_column_name`)
  const selectedCohortColumn = find(cohortColumns?.filter_options, ['name', selectedCohortColumnName])

  const isGrouped = keys(groupBy(appendColumns?.filter_options, (col) => col.opt_group || 'Other')).length > 0

  const appendColumnOptions = map(appendColumns?.filter_options, (col) => {
    return {
      label: col.label,
      value: col.name,
      type: col.type,
      // if cohort is selected, make sure the options have the same type
      disabled: selectedCohortColumn && selectedCohortColumn.type !== col.type,
      optGroupBy: (isGrouped && (col.opt_group || 'Other')) || undefined,
    }
  })

  const selectedAppendColumn = find(appendColumns?.filter_options, ['name', appendColumnName])

  useEffect(() => {
    if (!!selectedAppendColumn && !isEqual(selectedAppendColumn?.enrichment_table, enrichmentTableValue)) {
      onChangeEnrichmentTable(selectedAppendColumn?.enrichment_table)
    }
  }, [onChangeEnrichmentTable, selectedAppendColumn?.enrichment_table, enrichmentTableValue])

  return (
    <Controller
      control={control}
      name={`${fieldName}.append_column_name`}
      rules={{ validate: required }}
      render={({ field }) => (
        <SearchSelect
          style={{ minWidth: 100 }}
          optionFilterProp="label"
          optionLabelProp="label"
          options={appendColumnOptions}
          placeholder="Column"
          popupMatchSelectWidth={false}
          isGrouped={isGrouped}
          createOptionContent={handleCreateOptionContent}
          {...field}
        />
      )}
    />
  )
}

export default AppendColumnName

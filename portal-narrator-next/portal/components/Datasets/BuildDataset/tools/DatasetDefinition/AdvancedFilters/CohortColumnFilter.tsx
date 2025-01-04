/* eslint-disable react/jsx-max-depth */
import { CloseCircleOutlined } from '@ant-design/icons'
import { Space } from 'antd-next'
import { SearchSelect } from 'components/antd/staged'
import { handleCreateOptionContent } from 'components/Datasets/BuildDataset/tools/DatasetDefinition/AdvancedFilters/ColumnFilterInputs'
import { Box, Typography } from 'components/shared/jawns'
import { find, groupBy, isEqual, keys, map } from 'lodash'
import { useCallback } from 'react'
import { Controller, UseFieldArrayRemove, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { IActivityColumnOptions } from 'util/datasets/interfaces'
import { required } from 'util/forms'

import AppendColumnName from './AppendColumnName'
import CohortFilterOperator from './CohortFilterOperator'
import ConnectingFilterBox from './ConnectingFilterBox'

const StyledClose = styled.div`
  position: absolute;
  top: 0;
  z-index: 1;
  margin-left: -20px;
  margin-top: 5px;

  & > span.anticon {
    background-color: white;
  }
`

interface Props {
  fieldName: string
  appendColumns: IActivityColumnOptions
  cohortColumns: IActivityColumnOptions
  cohortActivityName: string
  appendActivityName: string
  removeCohortColumnFilter: UseFieldArrayRemove
  index: number
  isViewMode?: boolean
}

const CohortColumnFilter = ({
  fieldName,
  appendColumns,
  cohortColumns,
  cohortActivityName,
  appendActivityName,
  removeCohortColumnFilter,
  index,
  isViewMode = false,
}: Props) => {
  const { control, watch, setValue } = useFormContext()

  const isGrouped = keys(groupBy(cohortColumns.filter_options, (col) => col.opt_group || 'Other')).length > 0

  const cohortColumnOptions = map(cohortColumns.filter_options, (col) => ({
    label: col.label,
    value: col.name,
    type: col.type,
    optGroupBy: (isGrouped && (col.opt_group || 'Other')) || undefined,
  }))

  const cohortColumnNameFieldName = `${fieldName}.cohort_column_name`

  const selectedAppendColumnName = watch(`${fieldName}.append_column_name`)
  const selectedAppendColumn = find(appendColumns?.filter_options, ['name', selectedAppendColumnName])

  // handle selecting cohort name and clearing append_column_name/append_column if column types mismatch
  const handleSelectColumnName = useCallback(
    (name: string) => {
      // set selected cohort column name
      setValue(cohortColumnNameFieldName, name, { shouldValidate: true })

      // if there is an append column already selected
      if (selectedAppendColumn) {
        // clear the append column and name if they don't have the same type as cohort column
        const selectedCohortColumn = find(cohortColumns.filter_options, ['name', name])
        if (selectedCohortColumn && !isEqual(selectedAppendColumn.type, selectedCohortColumn.type)) {
          setValue(`${fieldName}.append_column`, null, { shouldValidate: true })
          setValue(`${fieldName}.append_column_name`, null, { shouldValidate: true })
        }
      }
    },
    [selectedAppendColumn, cohortColumnNameFieldName, fieldName, setValue]
  )

  return (
    <Box my={1} relative>
      <Space align="start">
        <ConnectingFilterBox mt="5px">
          <Typography type="body50" style={{ whiteSpace: 'nowrap' }}>
            but only if <strong>{cohortActivityName}</strong>
          </Typography>
        </ConnectingFilterBox>
        <Space align="start" style={{ flexWrap: 'wrap', rowGap: 8 }}>
          <Controller
            control={control}
            name={cohortColumnNameFieldName}
            rules={{ validate: required }}
            render={({ field }) => (
              <SearchSelect
                style={{ minWidth: 100 }}
                optionFilterProp="label"
                optionLabelProp="label"
                options={cohortColumnOptions}
                isGrouped={isGrouped}
                placeholder="Column"
                popupMatchSelectWidth={false}
                createOptionContent={handleCreateOptionContent}
                {...field}
                onChange={handleSelectColumnName}
              />
            )}
          />
          <Space align="start">
            <CohortFilterOperator fieldName={fieldName} filterOptions={cohortColumns.filter_options} />
          </Space>

          <Space align="start">
            <Box mt="5px">
              <Typography type="body50">
                <strong>{appendActivityName}</strong>
              </Typography>
            </Box>

            <AppendColumnName fieldName={fieldName} appendColumns={appendColumns} cohortColumns={cohortColumns} />
          </Space>
        </Space>
      </Space>
      {!isViewMode && (
        <StyledClose>
          <CloseCircleOutlined onClick={() => removeCohortColumnFilter(index)} />
        </StyledClose>
      )}
    </Box>
  )
}

export default CohortColumnFilter

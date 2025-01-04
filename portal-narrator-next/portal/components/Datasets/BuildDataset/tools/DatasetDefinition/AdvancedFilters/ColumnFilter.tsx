import { CloseCircleOutlined } from '@ant-design/icons'
import { Space } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import { find, isEmpty, map } from 'lodash'
import { Controller, UseFieldArrayRemove, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { IDatasetDefinitionColumn } from 'util/datasets/interfaces'
import { required } from 'util/forms'

import ColumnFilterInputs from './ColumnFilterInputs'
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
  filterColumnOptions: IDatasetDefinitionColumn[]
  removeColumnFilter: UseFieldArrayRemove
  index: number
  isGrouped: boolean
  isViewMode?: boolean
}

const ColumnFilter = ({
  fieldName,
  filterColumnOptions,
  removeColumnFilter,
  index,
  isGrouped,
  isViewMode = false,
}: Props) => {
  const { control, watch } = useFormContext()

  const backfillActivityColumnNameFieldname = `${fieldName}.activity_column_name`
  const activityColumnNameFieldname = `${fieldName}.activity_column.name`
  const backfillActivityColumnName = watch(backfillActivityColumnNameFieldname)
  // We used to target activity_column_name, but now we target activity_column.name
  // Make sure to use backfill if it exists, otherwise use the new fieldname
  const columnNameFieldname = isEmpty(backfillActivityColumnName)
    ? activityColumnNameFieldname
    : backfillActivityColumnNameFieldname

  const selectableColumnOptions = map(filterColumnOptions, (col) => ({
    label: col.label,
    value: col.name,
    type: col.type,
    optGroupBy: (isGrouped && col.opt_group) || undefined,
  }))

  const handleRemove = () => removeColumnFilter(index)

  return (
    <Box my={1} relative>
      <Space align="start">
        <ConnectingFilterBox mt="5px">
          <Typography type="body50" style={{ whiteSpace: 'nowrap' }}>
            but only if
          </Typography>
        </ConnectingFilterBox>

        <Controller
          name={columnNameFieldname}
          rules={{ validate: required }}
          control={control}
          render={({ field }) => {
            const column = find(filterColumnOptions, ['name', field.value])

            return (
              <ColumnFilterInputs
                fieldName={fieldName}
                column={column}
                columnOptions={selectableColumnOptions}
                isGrouped={isGrouped}
                {...field}
              />
            )
          }}
        />
      </Space>
      {!isViewMode && (
        <StyledClose>
          {' '}
          <CloseCircleOutlined onClick={handleRemove} />
        </StyledClose>
      )}
    </Box>
  )
}
export default ColumnFilter

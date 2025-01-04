import { CloseOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Popover, Tooltip } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { find, includes, isEmpty, map, take, truncate } from 'lodash'
import { useContext, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { AGGREGATE_ACTIVITY_RELATIONSHIPS } from 'util/datasets'
import { IActivityColumnOptions } from 'util/datasets/interfaces'

import EditLabelField from './EditLabelField'

const ACTIVITY_TIMESTAMP_COLUMN_NAME = 'ts'
const ACTIVITY_TIMESTAMP_TOOLTIP = 'The activity timestamp column is required. Try "Hide Column" instead.'

const ColumnRowWrapper = styled(({ hidden, ...props }) => <Flex {...props} />)`
  width: 100%;
  opacity: ${({ hidden }) => (hidden ? 0.5 : 1)};
  text-decoration: ${({ hidden }) => (hidden ? 'line-through' : 'initial')};

  svg {
    display: block;
  }
`
const ColumnLabelWrapper = styled(({ selected, asHeader, kpiLocked, ...props }) => <Flex {...props} />)`
  width: 100%;
  min-width: 0;
  margin-right: ${({ asHeader }) => (asHeader ? '0px' : '16px')};
  align-items: center;
  cursor: ${({ kpiLocked }) => (kpiLocked ? 'default' : 'pointer')};

  /* When column is selected make sure to maintain the hover styles: */
  svg {
    display: ${({ selected }) => (selected ? 'block' : 'none')};
  }

  p {
    color: ${({ selected, theme }) => (selected ? theme.colors.blue500 : 'inherit')};
  }

  &:hover {
    svg {
      display: block;
    }

    p {
      color: ${(props) => props.theme.colors.blue500};
    }
  }
`

interface Props {
  fieldName: string
  onRemove(): void
  columnName?: string
  relationshipSlug?: string
  activityFieldName: string
}

/**
 * For editing DatasetDefinition only!
 */
const EditColumnRow = ({ columnName, fieldName, onRemove, relationshipSlug, activityFieldName }: Props) => {
  const { machineCurrent } = useContext(DatasetFormContext)
  const { kpi, _definition_context } = machineCurrent.context

  const [renamingColumn, setRenamingColumn] = useState(false)

  const { watch, setValue } = useFormContext()
  const activityIds = watch(`${activityFieldName}.activity_ids`)

  const columnOptions =
    find(_definition_context.column_options, {
      activity_ids: activityIds,
      relationship_slug: relationshipSlug || null,
    }) || ({} as IActivityColumnOptions)

  const selectedOption = find(columnOptions?.select_options, ['name', columnName])
  const topColumnValues = isEmpty(selectedOption?.values) ? [] : take(selectedOption?.values, 5)

  const labelValue = watch(`${fieldName}.label`)
  const handleOnChangeLabel = (value: string) => {
    setValue(`${fieldName}.label`, value, { shouldValidate: true })
  }

  const kpiLocked = watch(`${fieldName}.kpi_locked`)

  // Don't allow users to delete activity timestamps
  // unless they're from an aggregate relationship:
  // aggregate in between, aggregate all ever, etc...
  const isActivityTimestampColumn = columnName === ACTIVITY_TIMESTAMP_COLUMN_NAME
  const isAggRelationship = includes(AGGREGATE_ACTIVITY_RELATIONSHIPS, relationshipSlug)
  // also don't let user delete kpi_locked columns
  const cannotDelete = (isActivityTimestampColumn && !isAggRelationship) || kpiLocked

  const handleRemove = () => {
    // If the user was renaming while removing the row, make sure to reset renamingColumn:
    setRenamingColumn(false)
    onRemove()
  }

  const handleRenameBlur = (value: string) => {
    handleOnChangeLabel(value)
    setRenamingColumn(false)
  }

  return (
    <ColumnRowWrapper justifyContent="space-between" alignItems="center" data-test="edit-column-row">
      <ColumnLabelWrapper
        kpiLocked={kpiLocked}
        onClick={() => {
          if (!renamingColumn && !kpiLocked) {
            setRenamingColumn(true)
          }
        }}
      >
        <Box flexGrow={1}>
          <EditLabelField
            renaming={renamingColumn}
            toggleRenaming={() => setRenamingColumn(!renamingColumn)}
            onChange={handleOnChangeLabel}
            value={labelValue}
            onBlur={handleRenameBlur}
            withCloseIcon={false}
          />
        </Box>
        {!renamingColumn && !kpiLocked && (
          <Box pl="4px">
            <EditOutlined style={{ color: colors.blue500 }} />
          </Box>
        )}
      </ColumnLabelWrapper>

      <Flex alignItems="center">
        {!isEmpty(topColumnValues) && (
          <Popover
            placement="right"
            content={
              <Box>
                {map(topColumnValues, (val) => (
                  <Flex justifyContent="space-between" key={`${val.key}_${val.value}`} px={1}>
                    <Typography pr={2} title={val.key.length > 55 ? val.key : undefined}>
                      {truncate(val.key, { length: 55 })}
                    </Typography>
                    <Typography>{val.value}</Typography>
                  </Flex>
                ))}
              </Box>
            }
          >
            <Box mr={1}>
              <InfoCircleOutlined style={{ color: colors.gray500 }} />
            </Box>
          </Popover>
        )}

        {/* Don't allow users to delete activity timestamps! */}
        {cannotDelete ? (
          <Tooltip
            placement="right"
            title={
              kpiLocked
                ? `This is part of the ${kpi?.name} definition and cannot be deleted`
                : ACTIVITY_TIMESTAMP_TOOLTIP
            }
          >
            <CloseOutlined style={{ color: colors.gray300, fontSize: 12, cursor: 'not-allowed' }} />
          </Tooltip>
        ) : (
          <Box onClick={handleRemove} style={{ cursor: 'pointer' }}>
            <CloseOutlined style={{ color: colors.gray500, fontSize: 12 }} />
          </Box>
        )}
      </Flex>
    </ColumnRowWrapper>
  )
}

export default EditColumnRow

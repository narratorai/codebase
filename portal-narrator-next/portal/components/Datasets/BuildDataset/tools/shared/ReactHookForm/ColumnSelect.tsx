import { Select } from 'antd-next'
import { FormItem, SearchSelect, SearchSelectOptionProps } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import { compact, defer, filter, find, flatMap, get, isEmpty, isFunction, map } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import React, { useContext, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { ALL_COLUMN_TYPES, getGroupColumns, makeColumnSearchSelectOptions, TOOL_COMPUTED } from 'util/datasets'
import { IDatasetQueryColumn } from 'util/datasets/interfaces'
import { ISelectableSearchColumn } from 'util/datasets/v2/helpers'
import { required } from 'util/forms'

const { Option } = Select

// supports an absolutely positioned selectable check mark for mode: "multiple"
const StyledSelect = styled(({ className, mode, ...props }) => (
  <SearchSelect popupClassName={className} mode={mode} {...props} />
))`
  ${({ mode }) =>
    mode === 'multiple'
      ? `
    .antd5-select-item-option-content {
      padding-right: 8px;
    }
    .antd5-select-item-option-state {
      position: absolute;
      right: 5px;
      top: 2px;
    }
  `
      : null}
`

export const handleCreateOptionContent = ({
  searchValue,
  option,
}: {
  searchValue: string
  option: SearchSelectOptionProps
}) => (
  <Option key={option.value} label={option.label} value={option.value} disabled={option.disabled}>
    <Flex justifyContent="space-between" alignItems="center">
      <Box data-test={`column-select-label-${option.disabled ? 'disabled' : 'enabled'}`}>
        <Mark value={option.label} snippet={searchValue} />
      </Box>
      <Box px={1}>
        <Typography type="body300" color="gray500">
          {option.type}
        </Typography>
      </Box>
    </Flex>
  </Option>
)

interface Props {
  baseDatasetColumnOptions?: boolean
  columnTypes?: string[]
  fieldName?: string
  fieldKey?: string
  layout?: 'vertical' | 'horizontal'
  noStyle?: boolean
  style?: Record<string, any>
  help?: React.ReactNode
  maxWidth?: string | number
  groupSlugOverride?: string
  labelText?: string
  placeholder?: string
  inputProps?: any // TODO better
  isRequired?: boolean
  omitColumnIds?: string[]
  defaultNthOptionWithFilter?: {
    index: number
    filter?: (columns: IDatasetQueryColumn[]) => IDatasetQueryColumn[]
  }
}

const ColumnSelect = ({
  baseDatasetColumnOptions = false,
  columnTypes = ALL_COLUMN_TYPES,
  inputProps = {},
  omitColumnIds,
  fieldName,
  fieldKey = 'column_id',
  labelText = 'Select Column',
  placeholder = 'Select Column',
  layout = 'vertical',
  noStyle = false,
  style = {},
  help = undefined,
  maxWidth = undefined,
  defaultNthOptionWithFilter = undefined,

  // allowOverrides
  isRequired = true,
  groupSlugOverride,
}: Props) => {
  const { groupSlug, machineCurrent, streamActivities, toolOverlay } = useContext(DatasetFormContext)
  const isParentDuplicate = machineCurrent.context._is_parent_duplicate

  const fieldNameWithDefault = fieldName ? fieldName : `source_details.${fieldKey}`

  const { watch, setValue, control } = useFormContext()

  // If we are editing a compute column, make sure not to include it into it's drop down options
  const stagedValues = watch()

  const selectValue = watch(fieldNameWithDefault)
  const selectOnChange = (value?: string) => setValue(fieldNameWithDefault, value, { shouldValidate: true })

  // (make sure you're on a computed overlay since we don't clean staged values when you leave an overlay)
  const computedColumnId = toolOverlay === TOOL_COMPUTED ? get(stagedValues, 'id', null) : null
  const updatedOmitColumnIds = compact(flatMap([omitColumnIds, computedColumnId]))

  // From the context of a ColumnSelect within a group by sometimes
  // you still want the raw Dataset Column options:
  // Also support groupSlugOverride because ColumnSelect is being used
  // outside BuildDataset <Form> (see MaterializationConfig)
  const groupSlugWithOverride = baseDatasetColumnOptions ? undefined : groupSlugOverride || groupSlug

  const searchSelectOptions = makeColumnSearchSelectOptions({
    activities: streamActivities,
    queryDefinition: makeQueryDefinitionFromContext(machineCurrent.context),
    columnTypes,
    groupSlug: groupSlugWithOverride,
    omitColumnIds: updatedOmitColumnIds,
    isParentDuplicate,
  })

  let defaultValue: string | undefined
  // check if defaultNthOptionWithFilter is a number (0 index would evaluate as false otherwise)
  // and no filter options
  if (defaultNthOptionWithFilter && isFinite(defaultNthOptionWithFilter?.index)) {
    let filteredOptions: { disabled?: boolean; value: string }[] | ISelectableSearchColumn[] = [...searchSelectOptions]

    // if a column filter was provided, apply it
    if (isFunction(defaultNthOptionWithFilter?.filter)) {
      // get all columns from the parent or group
      const group = find(machineCurrent.context.all_groups, ['slug', groupSlugWithOverride])

      const groupedColumns =
        groupSlugWithOverride && group
          ? (getGroupColumns({ group }) as IDatasetQueryColumn[])
          : machineCurrent.context.columns

      // apply the filter to the parent's or group's columns
      const filteredColumns = defaultNthOptionWithFilter?.filter(groupedColumns)
      // if any filtered results come back, use them for nth selection
      if (!isEmpty(filteredColumns)) {
        const tempFilteredOptions = map(filteredColumns, (col) => {
          // include value (column id) and disabled
          return { value: col.id, disabled: find(filteredOptions, ['value', col.id])?.disabled }
        })

        filteredOptions = tempFilteredOptions
      }

      // if filter was applied, but no columns came back, do not select default value
      if (isEmpty(filteredColumns)) {
        filteredOptions = []
      }
    }

    // only choose non-disabled options
    const eligibleOptions = filter(filteredOptions, (ops) => !ops.disabled)
    const nthOption = eligibleOptions[defaultNthOptionWithFilter.index]

    if (nthOption) {
      defaultValue = nthOption.value
    }
  }

  // if default set through defaultNthOptionWithFilter, set it as value (if there isn't already a selected value)
  useEffect(() => {
    if (isEmpty(selectValue) && !isEmpty(defaultValue)) {
      // defer is to ensure final form has up to date values (especially in parent form objects)
      defer(() => selectOnChange(defaultValue))
    }
  }, [defaultValue, selectValue, selectOnChange])

  return (
    <Controller
      control={control}
      name={fieldNameWithDefault}
      rules={{
        validate: (v) => {
          if (isRequired) {
            return required(v)
          }
        },
      }}
      render={({ field, fieldState: { isTouched: touched, error } }) => (
        <FormItem
          noStyle={noStyle}
          label={labelText}
          meta={{ touched, error: error?.message }}
          help={help}
          layout={layout}
          required={isRequired}
        >
          <StyledSelect
            data-test="column-select"
            style={{ minWidth: 140, maxWidth, width: '100%', ...style }}
            placeholder={placeholder}
            popupMatchSelectWidth={false}
            showSearch
            optionFilterProp="label"
            optionLabelProp="label"
            isGrouped
            options={searchSelectOptions}
            createOptionContent={handleCreateOptionContent}
            {...field}
            {...inputProps}
          />
        </FormItem>
      )}
    />
  )
}

export default ColumnSelect

import { Select } from 'antd-next'
import { FormItem, SearchSelect } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Box, Flex, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import { compact, defer, filter, find, flatMap, get, isEmpty, isFinite, isFunction, map } from 'lodash'
import { makeQueryDefinitionFromContext } from 'machines/datasets'
import PropTypes from 'prop-types'
import React, { useContext, useEffect } from 'react'
import { Field, useField, useFormState } from 'react-final-form'
import styled from 'styled-components'
import { ALL_COLUMN_TYPES, getGroupColumns, makeColumnSearchSelectOptions, TOOL_COMPUTED } from 'util/datasets'
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

const ColumnSelect = ({
  baseDatasetColumnOptions,
  columnTypes,
  inputProps,
  omitColumnIds,
  fieldName,
  fieldKey,
  labelText,
  placeholder,
  layout = 'vertical',
  noStyle,
  help,
  maxWidth = undefined,
  defaultNthOptionWithFilter = undefined,
  style = {},

  // allowOverrides
  isRequired,
  groupSlugOverride,
}) => {
  const { groupSlug, machineCurrent, streamActivities, toolOverlay } = useContext(DatasetFormContext)
  const isParentDuplicate = machineCurrent.context._is_parent_duplicate

  const fieldNameWithDefault = fieldName ? fieldName : `source_details.${fieldKey}`

  const { input } = useField(fieldNameWithDefault, { subscription: { value: true } })
  const { value: selectValue, onChange: selectOnChange } = input

  // If we are editing a compute column, make sure not to include it into it's drop down options
  const { values: stagedValues } = useFormState({ subscription: { values: true } })

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

  let defaultValue
  // check if defaultNthOptionWithFilter is a number (0 index would evaluate as false otherwise)
  // and no filter options
  if (isFinite(defaultNthOptionWithFilter?.index)) {
    let filteredOptions = [...searchSelectOptions]

    // if a column filter was provided, apply it
    if (isFunction(defaultNthOptionWithFilter?.filter)) {
      // get all columns from the parent or group
      const groupedColumns = groupSlugWithOverride
        ? getGroupColumns({ group: find(machineCurrent.context.all_groups, ['slug', groupSlugWithOverride]) })
        : machineCurrent.context.columns

      // apply the filter to the parent's or group's columns
      const filteredColumns = defaultNthOptionWithFilter?.filter(groupedColumns)
      // if any filtered results come back, use them for nth selection
      if (!isEmpty(filteredColumns)) {
        const tempFilteredOptions = map(filteredColumns, (col) => {
          // include value (column id) and disabled
          return { value: col.id, disabled: find(filteredOptions, ['value', col.id]).disabled }
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

  const handleCreateOptionContent = ({ searchValue, option }) => (
    <Option key={option.value} label={option.label} value={option.value} disabled={option.disabled}>
      <Flex justifyContent="space-between">
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

  return (
    <Field
      name={fieldNameWithDefault}
      validate={isRequired ? required : null}
      render={({ input, meta }) => (
        <FormItem noStyle={noStyle} label={labelText} meta={meta} required={isRequired} help={help} layout={layout}>
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
            {...input}
            {...inputProps}
          />
        </FormItem>
      )}
    />
  )
}

ColumnSelect.propTypes = {
  baseDatasetColumnOptions: PropTypes.bool.isRequired,
  columnTypes: PropTypes.array.isRequired,
  fieldName: PropTypes.string,
  groupSlugOverride: PropTypes.string,
  labelText: PropTypes.string,
  placeholder: PropTypes.string,
  inputProps: PropTypes.shape({}),
  isRequired: PropTypes.bool.isRequired,
  omitColumnIds: PropTypes.array,
  defaultNthOptionWithFilter: PropTypes.shape({
    index: PropTypes.number,
    filter: PropTypes.func,
  }),
  help: PropTypes.string,
}

ColumnSelect.defaultProps = {
  baseDatasetColumnOptions: false,
  columnTypes: ALL_COLUMN_TYPES,
  fieldKey: 'column_id',
  inputProps: {},
  isRequired: true,
  labelText: 'Select Column',
  placeholder: 'Select Column',
  noStyle: false,
  help: undefined,
}

export default ColumnSelect

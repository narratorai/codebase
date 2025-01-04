import { Button, Select, Space } from 'antd-next'
import { Divider, FormItem, SearchSelect } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Flex } from 'components/shared/jawns'
import { filter, flatMap, groupBy, includes, keys, map, take, values } from 'lodash'
import { useContext, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { IDatasetDefinitionSelectColumn } from 'util/datasets/interfaces'

import OptionContents, { IOption } from './OptionContents'

const { Option } = Select

// supports an absolutely positioned selectable check mark for mode: "multiple"
const StyledSelect = styled(({ className, ...props }) => <SearchSelect popupClassName={className} {...props} />)`
  .antd5-select-item-option-content {
    padding-right: 16px;
  }

  .antd5-select-item-option-state {
    position: absolute;
    right: 5px;
    top: 8px;
  }
`

interface Props {
  onClose(): void
  addColumns(): void
  selectedColumns: string[]
  setSelectedColumns(columns: string[]): void
  allSelectableColumns: IDatasetDefinitionSelectColumn[]
  alreadySelectedColumnNames: string[]
}

const AdditionalColumnContent = ({
  onClose,
  addColumns,
  selectedColumns,
  setSelectedColumns,
  allSelectableColumns,
  alreadySelectedColumnNames,
}: Props) => {
  const [submittedNonEditMode, setSubmittedNonEditMode] = useState(false)

  const { watch } = useFormContext()
  const formValue = watch()

  const { machineCurrent, machineSend } = useContext(DatasetFormContext)
  const inEditDefinitionMode = machineCurrent.matches({ edit: 'definition' })
  const submittingActivityColumns = machineCurrent.matches({ api: 'submitting_activity_columns' })
  const additionalColumns = filter(allSelectableColumns, (col) => !includes(alreadySelectedColumnNames, col.name))

  // Group columns by opt_group
  // ex: "Activity Columns", "Enrichment Columns", etc...
  const groupedAdditionalColumns = groupBy(additionalColumns, (col) => col.opt_group || 'Other')
  const showGroupedColumns = keys(groupedAdditionalColumns).length > 0

  const handleSelectChange = (selectValue: any[]) => {
    setSelectedColumns(selectValue)
  }

  // When in Edit Definition
  const handleAddAndClose = () => {
    addColumns()
    onClose()
  }

  // When outside of Edit Definition
  const nonEditDefinitionSubmit = () => {
    addColumns()
    setSubmittedNonEditMode(true)
  }

  // Unify Edit vs non-Edit Definition into one function
  const handleAddAndCloseDependingOnEdit = () => {
    if (inEditDefinitionMode) {
      handleAddAndClose()
    } else {
      nonEditDefinitionSubmit()
    }
  }

  // For non-Edit Definition
  // useEffect to make sure that formValue has updated with added columns
  useEffect(() => {
    if (submittedNonEditMode && !submittingActivityColumns) {
      setSubmittedNonEditMode(false)
      machineSend('SUBMITTING_ACTIVITY_COLUMNS', { formValue })
      onClose()
    }
  }, [submittedNonEditMode, formValue, onClose, machineSend, submittingActivityColumns])

  const flattenColumnValuesKeyValue = (columnValues: { key: string; value: string }[]) => {
    return [...flatMap(columnValues, (val) => values(val))].join(' ')
  }

  const options = map(additionalColumns, (col) => ({
    key: col.name,
    value: col.name,
    label: col.dropdown_label || col.label,
    // columnType and columnValues used to show meta data about a column in OptionContents
    columnType: col.type,
    // we only show the top 5 values
    columnValues: take(col.values, 5),
    // but we allow search on all values
    // (currently you wont see highlighting on values that aren't in the top 5)
    extraSearchValues: flattenColumnValuesKeyValue(col.values),
    optGroupBy: showGroupedColumns ? col.opt_group : undefined,
  }))

  const handleCreateOptionContent = ({ searchValue, option }: { searchValue: string; option: IOption }) => (
    <Option
      key={option.key || option.value}
      value={option.value}
      label={option.label}
      style={{ borderBottom: `1px solid ${colors.gray200}` }}
      data-test="additional-column-option"
    >
      <OptionContents option={option} searchValue={searchValue} />
    </Option>
  )

  return (
    <>
      <FormItem label="Select Columns" layout="vertical">
        <StyledSelect
          mode="multiple"
          showSearch
          onChange={handleSelectChange}
          value={selectedColumns}
          placeholder="Select additional columns"
          optionFilterProp="label"
          optionLabelProp="label"
          listHeight={400}
          style={{ maxWidth: 340, width: '100%' }}
          data-test="additional-column-select"
          options={options}
          isGrouped={showGroupedColumns}
          createOptionContent={handleCreateOptionContent}
        />
      </FormItem>

      <Divider fullPopoverWidth />
      <Flex justifyContent="flex-end">
        <Space>
          <Button onClick={onClose}>Cancel</Button>

          <Button type="primary" disabled={selectedColumns.length === 0} onClick={handleAddAndCloseDependingOnEdit}>
            Add
          </Button>
        </Space>
      </Flex>
    </>
  )
}

export default AdditionalColumnContent

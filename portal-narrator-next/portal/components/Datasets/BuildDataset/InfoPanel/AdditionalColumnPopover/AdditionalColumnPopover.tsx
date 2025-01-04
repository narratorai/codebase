import { Popover, Spin } from 'antd-next'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Typography } from 'components/shared/jawns'
import { find, forEach, map } from 'lodash'
import React, { useContext, useState } from 'react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { IActivityColumnOptions, IDatasetDefinitionSelectColumn } from 'util/datasets/interfaces'

import InfoPanelAddButton from '../InfoPanelAddButton'
import AdditionalColumnContent from './AdditionalColumnContent'

interface AdditionalColumnPopoverProps {
  activityFieldName: string
}

const AdditionalColumnPopover: React.FC<AdditionalColumnPopoverProps> = ({ activityFieldName }) => {
  const { watch, control } = useFormContext()

  const [visible, setVisible] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])

  const activityIds = watch(`${activityFieldName}.activity_ids`)
  const relationshipSlug = watch(`${activityFieldName}.relationship_slug`)
  const activityColumns = watch(`${activityFieldName}.columns`)
  const { append: addActivityColumn } = useFieldArray({
    control,
    name: `${activityFieldName}.columns`,
  })

  const { machineCurrent, machineSend } = useContext(DatasetFormContext)
  const inEditDefinitionMode = machineCurrent.matches({ edit: 'definition' })
  const loadingAddColumnOptions = machineCurrent.matches({ api: 'loading_add_column_options' })
  const { _definition_context: definitionContext } = machineCurrent.context

  const columnOptions =
    find(definitionContext.column_options, {
      activity_ids: activityIds,
      relationship_slug: relationshipSlug || null,
    }) || ({} as IActivityColumnOptions)

  const allSelectableColumns: IDatasetDefinitionSelectColumn[] = columnOptions.select_options
  const alreadySelectedColumnNames = map(activityColumns, 'name')

  const handleAddColumns = () => {
    forEach(selectedColumns, (columnName) => {
      const selectedColumn = find(allSelectableColumns, ['name', columnName])
      if (selectedColumn) {
        // add _is_new field so we know what columns to animate!
        addActivityColumn({ ...selectedColumn, _is_new: true })
      }
    })
  }

  const handleClose = () => {
    setSelectedColumns([])
    setVisible(false)
  }

  const handleOpen = () => {
    setVisible(true)
    if (!inEditDefinitionMode) {
      machineSend('ADD_ACTIVITY_COLUMNS')
    }
  }

  return (
    <Popover
      title={<Typography>Add additional columns</Typography>}
      content={
        <Spin spinning={loadingAddColumnOptions}>
          <AdditionalColumnContent
            onClose={handleClose}
            selectedColumns={selectedColumns}
            setSelectedColumns={setSelectedColumns}
            addColumns={handleAddColumns}
            allSelectableColumns={allSelectableColumns}
            alreadySelectedColumnNames={alreadySelectedColumnNames}
          />
        </Spin>
      }
      open={visible}
      placement="right"
      trigger="click"
      overlayStyle={{
        minWidth: 480,
      }}
    >
      <div>
        <InfoPanelAddButton onClick={handleOpen} className="add-button" buttonText="Add Column" />
      </div>
    </Popover>
  )
}

export default AdditionalColumnPopover

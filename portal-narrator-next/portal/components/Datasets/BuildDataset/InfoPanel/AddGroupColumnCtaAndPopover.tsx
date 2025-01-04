import { Button, Popover, Space, Spin } from 'antd-next'
import { Divider } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import ColumnSelect from 'components/Datasets/BuildDataset/tools/shared/ColumnSelect'
import MachineError from 'components/Datasets/BuildDataset/tools/shared/MachineError'
import { Box, Flex } from 'components/shared/jawns'
import { map } from 'lodash'
import { useContext } from 'react'
import { Form } from 'react-final-form'
import { getGroupFromContext } from 'util/datasets'

import InfoPanelAddButton from './InfoPanelAddButton'

const INITIAL_VALUES = { column_ids: [] }

const AddGroupColumnCtaAndPopover = () => {
  const { groupSlug, machineCurrent, machineSend } = useContext(DatasetFormContext)

  const popoverVisible = machineCurrent.matches({ edit: 'add_columns_to_group' })
  const submitting = machineCurrent.matches({ api: 'adding_group_columns' })
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const handleSubmit = (values: any) => {
    machineSend('ADD_COLUMNS_TO_GROUP_SUBMIT', { groupSlug, columnIds: values.column_ids })
  }

  const handleOnClose = () => {
    machineSend('ADD_COLUMNS_TO_GROUP_CANCEL')
  }

  return (
    <Form
      initialValues={INITIAL_VALUES}
      onSubmit={handleSubmit}
      render={({ handleSubmit, invalid, form }) => (
        <Popover
          title="Add Columns to GROUP BY"
          trigger="click"
          placement="right"
          open={popoverVisible}
          onOpenChange={(visible: boolean) => {
            if (visible) {
              // Resets all form and field state. Same as calling reset() on the form and resetFieldState() for each field
              // FIXME - once they add this feature to the FormApi type definition, remove ts-ignore
              form.restart()
              return machineSend('ADD_COLUMNS_TO_GROUP')
            }
          }}
          overlayStyle={{ minWidth: 480 }}
          content={
            <Spin spinning={submitting}>
              <Box data-public>
                <MachineError />
                <Box style={{ maxWidth: '340px' }}>
                  <ColumnSelect
                    baseDatasetColumnOptions
                    labelText="Select Columns"
                    fieldName="column_ids"
                    omitColumnIds={map(group?.columns, 'column_id')}
                    inputProps={{ mode: 'multiple' }}
                  />
                </Box>
                <Divider fullPopoverWidth />
                <Flex justifyContent="flex-end">
                  <Space>
                    <Button onClick={handleOnClose}>Cancel</Button>
                    <Button type="primary" onClick={handleSubmit} disabled={invalid || submitting}>
                      Add Columns to Group
                    </Button>
                  </Space>
                </Flex>
              </Box>
            </Spin>
          }
        >
          <div>
            <InfoPanelAddButton className="add-button" buttonText="Add Column" disabled={false} />
          </div>
        </Popover>
      )}
    />
  )
}

export default AddGroupColumnCtaAndPopover

import { PlusOutlined } from '@ant-design/icons'
import { Button, Popover, Space, Spin, Tooltip } from 'antd-next'
import { Divider } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { ColumnSelect } from 'components/Datasets/BuildDataset/tools/shared'
import MachineError from 'components/Datasets/BuildDataset/tools/shared/MachineError'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import { useContext } from 'react'
import { Form } from 'react-final-form'
import { semiBoldWeight } from 'util/constants'

const INITIAL_VALUES = { column_ids: [] }

const GroupByCtaAndPopover = () => {
  const { machineCurrent, machineSend } = useContext(DatasetFormContext)

  const popoverVisible = machineCurrent.matches({ edit: 'create_group' })
  const submitting = machineCurrent.matches({ api: 'submitting_create_group' })

  const handleSubmit = (values: any) => {
    machineSend('CREATE_GROUP_SUBMIT', values)
  }

  return (
    <Form
      initialValues={INITIAL_VALUES}
      onSubmit={handleSubmit}
      render={({ handleSubmit, invalid, form, values }) => {
        const columnIdsValue = values.column_ids
        const showTimeWindow = !isEmpty(values.time_window)

        const onClose = () => {
          machineSend('CREATE_GROUP_CANCEL')
        }

        return (
          <Popover
            title="Add GROUP BY"
            trigger="click"
            placement="bottomRight"
            open={popoverVisible}
            onOpenChange={(visible: boolean) => {
              if (visible) {
                // Resets all form and field state. Same as calling reset() on the form and resetFieldState() for each field
                form.restart(INITIAL_VALUES)
                return machineSend('CREATE_GROUP')
              }
            }}
            overlayStyle={{
              width: 480,
            }}
            content={
              <Spin spinning={submitting}>
                <Box data-public data-test="group-by-popover-content">
                  <MachineError />
                  <Box style={{ maxWidth: '340px' }}>
                    <ColumnSelect
                      baseDatasetColumnOptions
                      labelText="Select Columns"
                      inputProps={{ mode: 'multiple' }}
                      fieldName="column_ids"
                      isRequired={false}
                    />
                  </Box>

                  <Divider fullPopoverWidth />
                  <Flex justifyContent="flex-end">
                    <Space>
                      <Button onClick={onClose}>Cancel</Button>

                      {isEmpty(columnIdsValue) && !showTimeWindow ? (
                        <Tooltip
                          placement="topRight"
                          title="Creating a GROUP BY without aggregate columns will generate the total count of records in the dataset"
                        >
                          <Button
                            data-test="create-group-cta"
                            type="primary"
                            onClick={handleSubmit}
                            disabled={invalid || submitting}
                          >
                            Create New Group
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button
                          data-test="create-group-cta"
                          type="primary"
                          onClick={handleSubmit}
                          disabled={invalid || submitting}
                        >
                          Create New Group
                        </Button>
                      )}
                    </Space>
                  </Flex>
                </Box>
              </Spin>
            }
          >
            <Button
              data-test="group-by-cta"
              type="dashed"
              icon={<PlusOutlined style={{ fontSize: 12 }} />}
              size="middle"
              style={{
                borderBottom: 'none',
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }}
            >
              <Typography as="span" type="body200" fontWeight={semiBoldWeight}>
                GROUP BY
              </Typography>
            </Button>
          </Popover>
        )
      }}
    />
  )
}

export default GroupByCtaAndPopover

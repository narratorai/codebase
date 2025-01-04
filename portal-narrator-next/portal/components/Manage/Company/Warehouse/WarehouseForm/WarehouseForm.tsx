import { Button, Spin } from 'antd-next'
import DynamicForm from 'components/shared/DynamicForm/DynamicForm'
import { Box, Flex } from 'components/shared/jawns'
import { WarehouseTypes } from 'portal/stores/settings'

import InlineDocs from './InlineDocs'

interface Props {
  schema: Record<string, unknown>
  ui_schema: Record<string, unknown>
  formData: Record<string, unknown> | null
  warehouseType: WarehouseTypes
  isEditing: boolean
  loading: boolean
  onSubmit: (form: any) => void
  onDelete: () => void
  onCancel: () => void
}

const WarehouseForm = ({
  warehouseType,
  schema,
  ui_schema,
  formData,
  isEditing,
  loading,
  onSubmit,
  onDelete,
  onCancel,
}: Props) => (
  <Flex mb={8} minWidth={600}>
    <Box p={3} width={2 / 5}>
      <Spin spinning={loading}>
        <DynamicForm
          formSchema={{ schema, ui_schema }}
          formData={formData}
          onSubmit={onSubmit}
          loading={loading}
          submitText="Test and Save"
          omitExtraData // this is required to clear out the ssl_tunnel property when the checkbox is unchecked. that property should NOT be present if ssh isn't chosen
          extraButtons={
            isEditing
              ? [
                  <Box key="delete" data-test="delete-connection-button">
                    <Button danger onClick={onDelete}>
                      Delete
                    </Button>
                  </Box>,
                ]
              : onCancel
                ? [
                    <Box key="cancel">
                      <Button onClick={onCancel}>Cancel</Button>
                    </Box>,
                  ]
                : []
          }
        />
      </Spin>
    </Box>

    <Box width={3 / 5} bg="gray200">
      <Box p={3}>
        <InlineDocs warehouseType={warehouseType} />
      </Box>
    </Box>
  </Flex>
)

export default WarehouseForm

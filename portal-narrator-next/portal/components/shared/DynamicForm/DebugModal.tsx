import { BugOutlined } from '@ant-design/icons'
import { UiSchema } from '@rjsf/core'
import { Button } from 'antd-next'
import { Modal } from 'components/antd/staged'
import Playground from 'components/Manage/Prototypes/Playground'
import { JSONSchema7 } from 'json-schema'
import { FC, useState } from 'react'
import { FormData } from 'util/blocks/interfaces'
import { colors } from 'util/constants'

interface DebugModalProps {
  schema: JSONSchema7
  uiSchema?: UiSchema
  formData: FormData
}

const DebugModal: FC<DebugModalProps> = ({ schema, uiSchema, formData }) => {
  const [showPlayground, setShowPlayground] = useState(false)

  const handleClose = () => setShowPlayground(false)
  return (
    <>
      <div style={{ marginLeft: '-48px', height: '100%' }}>
        <Button
          icon={<BugOutlined />}
          type="text"
          danger
          size="small"
          onClick={() => setShowPlayground(!showPlayground)}
        />
      </div>
      {showPlayground && (
        <Modal full open onCancel={handleClose} footer={null} bodyStyle={{ background: colors.red100 }}>
          <Playground initialSchema={schema} initialUiSchema={uiSchema} initialFormData={formData} />
        </Modal>
      )}
    </>
  )
}

export default DebugModal

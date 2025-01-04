import { Button, Modal } from 'antd-next'
import { useToggle } from 'react-use'

import { IFormData } from './NewApiKeyForm'
import NewApiKeyModal from './NewApiKeyModal'

interface Props {
  onCreate: (data: IFormData) => Promise<{ api_key: string }>
}

export default function NewApiKeyButton({ onCreate }: Props) {
  const [isNewModalOpen, toggleNewModal] = useToggle(false)

  return (
    <>
      <Button type="primary" onClick={toggleNewModal}>
        Create new
      </Button>
      <Modal
        title="New API key"
        open={isNewModalOpen}
        onCancel={() => toggleNewModal(false)}
        footer={null}
        maskClosable={false}
        destroyOnClose
      >
        <NewApiKeyModal onCreate={onCreate} />
      </Modal>
    </>
  )
}

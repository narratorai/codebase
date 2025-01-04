import { Modal, Spin } from 'antd-next'

import DeleteModalContent from './DeleteModalContent'
import DeleteModalTitle from './DeleteModalTitle'

interface Props {
  name: string
  isOpen: boolean
  isPrimary: boolean
  isLoading: boolean
  onSubmit: () => void
  onCancel: () => void
}

const DeleteModal = ({ name, isPrimary, isOpen, isLoading, onSubmit, onCancel }: Props) => (
  <Modal
    title={<DeleteModalTitle />}
    open={isOpen}
    onOk={onSubmit}
    onCancel={onCancel}
    okText="Delete"
    okType="danger"
    cancelText="Cancel"
    confirmLoading={isLoading}
  >
    <Spin spinning={isLoading}>
      <DeleteModalContent name={name} isPrimary={isPrimary} />
    </Spin>
  </Modal>
)

export default DeleteModal

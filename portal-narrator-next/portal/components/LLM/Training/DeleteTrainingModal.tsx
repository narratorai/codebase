import { App } from 'antd-next'
import { Modal } from 'components/antd/staged'
import { Typography } from 'components/shared/jawns'
import { useEffect } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'

interface Props {
  id: string
  question: string
  onClose: () => void
}

const DeleteTrainingModal = ({ id, question, onClose }: Props) => {
  const { notification } = App.useApp()

  const [deleteTraining, { response: deleteResponse, loading: deleting, error: deleteTrainingError }] =
    useLazyCallMavis<any>({
      method: 'DELETE',
      path: `/v1/llm/train/${id}`,
    })

  // handle successful delete
  useEffect(() => {
    if (deleteResponse && !deleteTrainingError) {
      notification.success({
        message: 'Training deleted successfully',
      })

      onClose()
    }
  }, [notification, deleteResponse, deleteTrainingError, onClose])

  const handleDeleteTraining = () => {
    deleteTraining({})
  }

  return (
    <Modal
      title="Are you sure you want to delete this Training?"
      onCancel={onClose}
      open
      onOk={handleDeleteTraining}
      okButtonProps={{ loading: deleting, disabled: deleting }}
    >
      <Typography>
        This will delete the training question: <span style={{ fontWeight: 'bold' }}>{question}</span>
      </Typography>
      <Typography mt={1}>(and all associated data)</Typography>
    </Modal>
  )
}

export default DeleteTrainingModal

import { DeleteOutlined } from '@ant-design/icons'
import { App, Popconfirm, Tooltip } from 'antd-next'
import { useEffect } from 'react'
import { colors } from 'util/constants'
import { zIndex } from 'util/constants'
import { useLazyCallMavis } from 'util/useCallMavis'
interface Props {
  id: string
  onClose?: () => void
}

const DeleteTrainingIcon = ({ id, onClose }: Props) => {
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

      onClose?.()
    }
  }, [notification, deleteResponse, deleteTrainingError, onClose])

  const handleDeleteTraining = () => {
    deleteTraining({})
  }

  return (
    <Popconfirm
      title="Are you sure you want to delete this Training?"
      onConfirm={handleDeleteTraining}
      okText="Yes"
      cancelText="No"
      okButtonProps={{ loading: deleting, disabled: deleting }}
      zIndex={zIndex.notification}
    >
      <Tooltip title="Delete Training">
        <DeleteOutlined style={{ color: colors.red500 }} />
      </Tooltip>
    </Popconfirm>
  )
}

export default DeleteTrainingIcon

import { useDeleteWarehouse, useGetWarehouses } from '../hooks'
import DeleteModal from './DeleteModal'

interface Props {
  isAdmin: boolean
  isOpen: boolean
  onClose: () => void
}

const DeleteModalContainer = ({ isAdmin, isOpen, onClose }: Props) => {
  const { adminWarehouse, nonAdminWarehouse } = useGetWarehouses()
  const { deletingWarehouse, deleteWarehouse } = useDeleteWarehouse(onClose)

  const name = isAdmin ? adminWarehouse?.name || 'warehouse' : nonAdminWarehouse?.name || 'warehouse'

  const isPrimary = !isAdmin
  const handleSubmit = () => deleteWarehouse({ isAdmin })

  return (
    <DeleteModal
      name={name}
      isPrimary={isPrimary}
      isOpen={isOpen}
      isLoading={deletingWarehouse}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  )
}

export default DeleteModalContainer

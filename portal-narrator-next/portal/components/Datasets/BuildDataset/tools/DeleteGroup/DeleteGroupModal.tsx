import { Modal } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Typography } from 'components/shared/jawns'
import { useContext } from 'react'
import { getGroupFromContext } from 'util/datasets'

const DeleteGroupModal = () => {
  const { machineCurrent, machineSend, groupSlug } = useContext(DatasetFormContext)

  const visible = machineCurrent.matches({ edit: 'delete_group' })
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const handleDelete = () => {
    machineSend('DELETE_GROUP_SUBMIT', { groupSlug })
  }

  const handleClose = () => {
    machineSend('DELETE_GROUP_CANCEL')
  }

  if (!group) {
    return null
  }

  return (
    <Modal
      title={<Typography type="title400">Delete Group</Typography>}
      open={visible}
      onCancel={handleClose}
      onOk={handleDelete}
      okButtonProps={{ danger: true, 'data-test': 'delete-group-cta' }}
    >
      <Typography type="title400">
        Are you sure you want to delete <b>{group.name}</b>?
      </Typography>
    </Modal>
  )
}

export default DeleteGroupModal

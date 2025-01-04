import { Input } from 'antd-next'
import { Modal } from 'components/antd/staged'
import DatasetFormContext from 'components/Datasets/BuildDataset/DatasetFormContext'
import { Typography } from 'components/shared/jawns'
import { useContext, useEffect, useState } from 'react'
import { getGroupFromContext } from 'util/datasets'

const RenameModal = () => {
  const [name, setName] = useState<string>()
  const { machineCurrent, machineSend, groupSlug } = useContext(DatasetFormContext)

  const visible = machineCurrent.matches({ edit: 'rename_group' })
  const group = getGroupFromContext({ context: machineCurrent.context, groupSlug })

  const handleRename = () => {
    machineSend('RENAME_GROUP_SUBMIT', { groupSlug, name })
  }

  const handleClose = () => {
    machineSend('RENAME_GROUP_CANCEL')
  }

  const groupName = group?.name

  // Make sure local state name has the proper default:
  useEffect(() => {
    if (groupName) {
      setName(groupName)
    }
  }, [groupName])

  if (!group) {
    return null
  }

  return (
    <Modal
      title={<Typography type="title400">Rename Group</Typography>}
      open={visible}
      onCancel={handleClose}
      onOk={handleRename}
    >
      <Input
        value={name}
        onChange={(event: any) => setName(event.target?.value)}
        onPressEnter={handleRename}
        data-test="rename-group-input"
      />
    </Modal>
  )
}

export default RenameModal

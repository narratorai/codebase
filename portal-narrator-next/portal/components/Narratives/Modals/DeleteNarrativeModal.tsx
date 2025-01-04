import { Spin } from 'antd-next'
import { Modal } from 'components/antd/staged'
import { DashboardType } from 'components/Narratives/Dashboards/DashboardIndex/interfaces'
import { useUpdateNarrativeMeta } from 'components/Narratives/hooks'
import { Typography } from 'components/shared/jawns'
import { INarrative, IStatus_Enum } from 'graph/generated'
import { startCase } from 'lodash'
import { useEffect } from 'react'

interface Props {
  narrative?: INarrative | DashboardType
  onClose: () => void
  onSuccess?: () => void
  isDashboard?: boolean
}

/**
 * Modal to delete a narrative.
 *
 * NOTE: We soft delete narratives by changing their state to "archived"
 */
const DeleteNarrativeModal = ({ narrative, onClose, onSuccess, isDashboard = false }: Props) => {
  const [updateNarrative, { loading, error, saved }] = useUpdateNarrativeMeta()

  // on successful soft delete, close modal
  useEffect(() => {
    if (saved) {
      onClose()
      onSuccess?.()
    }
  }, [saved, onClose, onSuccess])

  const handleOk = () => {
    if (narrative) {
      updateNarrative({
        name: narrative.name,
        slug: narrative.slug,
        state: IStatus_Enum.Archived, // This is the soft delete
        description: narrative.description || undefined,
        category: narrative.company_category?.category,
        created_by: narrative.created_by,
        type: narrative.type,
        narrative_id: narrative.id,
      })
    }
  }

  return (
    <Modal
      title={<Typography type="title400">{`Delete ${isDashboard ? 'Dashboard' : 'Analysis'}`}</Typography>}
      open={!!narrative}
      onCancel={() => {
        onClose()
      }}
      okButtonProps={{ danger: true, 'data-test': 'confirm-delete-narrative' }}
      onOk={handleOk}
    >
      <Spin spinning={loading}>
        <Typography type="title400">
          {' '}
          Are you sure you want to delete <b>{startCase(narrative?.name)}</b>?
        </Typography>
        {error && <Typography color="red500">{error.message}</Typography>}
      </Spin>
    </Modal>
  )
}

export default DeleteNarrativeModal

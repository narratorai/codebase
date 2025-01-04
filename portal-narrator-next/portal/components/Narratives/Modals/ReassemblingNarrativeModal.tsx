import { Modal } from 'antd-next'
import { useLoadSchemas } from 'components/Narratives/hooks'
import ProgressLoader from 'components/shared/ProgressLoader'
import { LoadingBarOption } from 'util/blocks/interfaces'

interface Props {
  isDashboard?: boolean
  onClose: () => void
  success: boolean
  loading: boolean
  error?: Error
}

// USED WHEN ASSEMBLING FROM ASSEMBLED NARRATIVE/DASHBOARD
const ReassemblingNarrativeModal = ({ onClose, success, loading, error, isDashboard }: Props) => {
  const { response: blockOptions } = useLoadSchemas()
  const loadingBar = blockOptions?.field_loading_screen as LoadingBarOption[]

  return (
    <Modal
      open
      onCancel={onClose}
      title={`Assembling ${isDashboard ? 'Dashboard' : 'Narrative'}`}
      width="1000px"
      style={{ maxWidth: '95vw' }}
      footer={null}
    >
      <ProgressLoader onClose={onClose} success={success} loading={loading} error={error} loadingBar={loadingBar} />
    </Modal>
  )
}

export default ReassemblingNarrativeModal

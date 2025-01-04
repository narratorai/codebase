import { Modal } from 'antd-next'
import GenericBlock from 'components/shared/Blocks/GenericBlock'
import { Box, Typography } from 'components/shared/jawns'
import React from 'react'
import useNavigate from 'util/useNavigate'

const TEMPLATE_SLUG = 'use_narrative_template_v5'
const TEMPLATE_VERSION = 1

interface Props {
  onClose: () => void
  isDashboard?: boolean
}

const SaveNarrativeTemplateModal = ({ onClose, isDashboard }: Props) => {
  const handleNavigate = useNavigate()

  const type = isDashboard ? 'dashboard' : 'analysis'
  const dashboardOrNarrativeText = isDashboard ? 'Dashboard' : 'Analysis'

  return (
    <Modal
      open
      width="80%"
      title={<Typography type="title400">Create {dashboardOrNarrativeText}</Typography>}
      onCancel={() => {
        onClose()
      }}
      footer={null}
    >
      <Box style={{ overflowX: 'scroll', minHeight: '600px' }}>
        <GenericBlock
          key={`${TEMPLATE_SLUG}_${TEMPLATE_VERSION}`}
          slug={TEMPLATE_SLUG}
          version={TEMPLATE_VERSION}
          onNavigateRequest={handleNavigate}
          initialFormData={{
            type,
          }}
        />
      </Box>
    </Modal>
  )
}

export default SaveNarrativeTemplateModal

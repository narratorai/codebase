import { Space } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { INarrativeFile } from 'components/Narratives/interfaces'
import { Box, Typography } from 'components/shared/jawns'
import { INarrative } from 'graph/generated'
import React from 'react'
import { formatTimeStampUtc } from 'util/helpers'

interface Props {
  narrative?: INarrative
  selectedFile?: INarrativeFile
}

const LastUpdatedAt = ({ narrative, selectedFile }: Props) => {
  const company = useCompany()

  if (!narrative || !selectedFile) return null
  return (
    <Box mb={3} className="d-print">
      <Space>
        <Typography color="gray700" type="body300">
          LAST UPDATED AT:
        </Typography>
      </Space>
      <Typography fontWeight="bold">{formatTimeStampUtc(selectedFile?.name, company.timezone)}</Typography>
    </Box>
  )
}

export default LastUpdatedAt

import { CalendarOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd-next'
import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import { Flex, Typography } from 'components/shared/jawns'
import React, { useContext } from 'react'
import { colors } from 'util/constants'
import { timeFromNow } from 'util/helpers'

const SnapshotTextAndButton = () => {
  const { selectedFile, toggleShowDateRange } = useContext(AnalysisContext)

  return (
    <Flex data-public alignItems="center" style={{ fontSize: '11px' }}>
      <Typography mr={1} style={{ color: colors.gray500 }}>{`(${timeFromNow(selectedFile?.name)})`}</Typography>
      <Tooltip title="Select different snapshot">
        <div>
          <Button size="small" onClick={toggleShowDateRange} icon={<CalendarOutlined />} data-test="snapshot-button" />
        </div>
      </Tooltip>
    </Flex>
  )
}

export default SnapshotTextAndButton

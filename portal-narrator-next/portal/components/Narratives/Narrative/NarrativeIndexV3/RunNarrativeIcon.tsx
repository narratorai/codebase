import { CaretRightOutlined } from '@ant-design/icons'
import { App, Button, Tooltip } from 'antd-next'
import { useAssembleNarrative } from 'components/Narratives/hooks'
import { Typography } from 'components/shared/jawns'
import { INarrative } from 'graph/generated'
import { useEffect } from 'react'
import { colors } from 'util/constants'
import { handleMavisErrorNotification } from 'util/useCallMavis'

import { NarrativeType } from './interfaces'

interface Props {
  narrative: NarrativeType
}

const RunNarrativeIcon = ({ narrative }: Props) => {
  const { notification } = App.useApp()
  const [assembleNarrative, { response: assembled, loading: assembling, error: errorAssembling }] =
    useAssembleNarrative()

  const handleRunNarrative = () => {
    assembleNarrative({ narrative: narrative as INarrative })
  }

  useEffect(() => {
    if (assembled) {
      notification.success({
        key: `assemble-narrative-success-${narrative.slug}`,
        placement: 'topRight',
        message: (
          <Typography type="title400">
            <span style={{ fontWeight: 'bold' }}>{narrative.name}</span> was successfully assembled
          </Typography>
        ),
      })
    }
  }, [assembled, narrative, notification])

  useEffect(() => {
    if (errorAssembling) {
      handleMavisErrorNotification({ error: errorAssembling, notification })
    }
  }, [errorAssembling, notification])

  return (
    <Tooltip title="Run this Narrative Now">
      <Button
        size="small"
        onClick={handleRunNarrative}
        loading={assembling}
        type="link"
        style={{ padding: 0 }}
        icon={<CaretRightOutlined style={{ color: colors.green500, fontSize: '20px' }} />}
      />
    </Tooltip>
  )
}

export default RunNarrativeIcon

import { InfoCircleOutlined } from '@ant-design/icons'
import { Alert, App, Popconfirm, Spin, Switch, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { useGetCompanyBatchHaltSubscription, useGetUserLazyQuery } from 'graph/generated'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'
import styled from 'styled-components'
import analytics from 'util/analytics'
import { colors } from 'util/constants'
import { formatTimeStamp, formatUnixTimestampUtc } from 'util/helpers'
import { useLazyCallMavis } from 'util/useCallMavis'
import useToggle from 'util/useToggle'

const SWITCH_CLASSNAME = 'cutsom-monitor-processing-switch'

const StyledSwitchContainer = styled(Box)`
  .${SWITCH_CLASSNAME}-checked {
    background-color: ${colors.green500} !important;
  }

  .${SWITCH_CLASSNAME}-unchecked {
    background-color: ${colors.red500} !important;
  }
`

const MonitorProcessingToggle = () => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { isCompanyAdmin, user } = useUser()
  const [showConfirmBatch, toggleShowConfirmPauseProcessing] = useToggle(false)

  // Get current state of batch halt from subscription
  const { data: batchHalted, error: batchHaltedError } = useGetCompanyBatchHaltSubscription({
    variables: { id: company?.id },
  })

  const [getHaltedByUser, { data: haltedByUserData, loading: haltedByUserLoading }] = useGetUserLazyQuery({
    fetchPolicy: 'cache-and-network',
  })

  const processingIsPaused = batchHalted?.company[0]?.batch_halt
  const processingLastPausedOn = batchHalted?.company[0]?.batch_halted_at
  const processingPausedBy = batchHalted?.company[0]?.batch_halted_by
  const processingLastPausedBy = haltedByUserData?.user[0]?.email

  // If we pause processing for another company graph won't let them see
  // our user (email) if we are not one of their company users.
  // So show them "Narrator"
  const formattedPausedBy = isEmpty(processingLastPausedBy) ? 'Narrator' : processingLastPausedBy

  // if processing has been halted
  useEffect(() => {
    if (!isEmpty(processingPausedBy)) {
      // get the user who halted it
      getHaltedByUser({ variables: { user_id: processingPausedBy } })
    }
  }, [getHaltedByUser, processingPausedBy])

  // Toggles batch halt on and off
  const [
    updateBatchHalt,
    { response: updateBatchHaltResponse, loading: updateBatchHaltLoading, error: updateBatchHaltError },
  ] = useLazyCallMavis<{
    batch_halt: boolean
    batch_halted_at?: string
    batch_halted_by?: string
  }>({
    method: 'POST',
    path: '/admin/v1/task/toggle_batch_halt',
  })

  const togglePauseProcessingStatus = () => {
    // Don't show confirm when toggling halt off
    !processingIsPaused && toggleShowConfirmPauseProcessing()

    analytics.track('toggled_processing', {
      paused: !processingIsPaused,
    })

    // only update halted at/by if they are halting it
    // (not when they are turning it back on)
    if (!processingIsPaused) {
      const now = Date.now()
      const utcTimeNow = formatUnixTimestampUtc(now)
      updateBatchHalt({ body: { batch_halt: true, batch_halted_at: utcTimeNow, batch_halted_by: user.id } })
    } else {
      // going live
      updateBatchHalt({ body: { batch_halt: false } })
    }
  }

  // success notification for batch halt (pause or unpause)
  useEffect(() => {
    if (updateBatchHaltResponse && !updateBatchHaltError) {
      const nowPaused = updateBatchHaltResponse?.batch_halt
      const message = nowPaused ? 'Your processing has been paused' : 'Your processing is now live'

      notification.success({
        key: 'batch-halt-success',
        placement: 'topRight',
        message,
      })
    }
  }, [updateBatchHaltResponse, updateBatchHaltError, notification])

  return (
    // 160px is designed to support the largest current side of tabs
    // dictated by max width of "Analyses and Dashboards"
    <Box style={{ width: '160px' }}>
      <Flex mb={1} alignItems="center">
        <Typography type="title400" mr={1}>
          Processing Status
        </Typography>

        <Tooltip title="This toggle controls all the scheduled processing that is run by Narrator.">
          <Box>
            <InfoCircleOutlined />
          </Box>
        </Tooltip>
      </Flex>

      {isCompanyAdmin && (
        <Tooltip title="Use this to pause all processing tasks">
          <div>
            {/* Don't show confirm when toggling halt off */}
            {processingIsPaused ? (
              <StyledSwitchContainer>
                <Switch
                  className={`${SWITCH_CLASSNAME}-${processingIsPaused ? 'unchecked' : 'checked'}`}
                  loading={updateBatchHaltLoading}
                  checked={!processingIsPaused}
                  checkedChildren="Live"
                  unCheckedChildren="Paused"
                  onChange={togglePauseProcessingStatus}
                />
              </StyledSwitchContainer>
            ) : (
              <Popconfirm
                title={
                  <Box style={{ maxWidth: '400px' }}>
                    <Typography type="title400">Are you sure you want to pause all your processing tasks?</Typography>
                    <Typography my={1}>
                      The Activity Stream will stop updating and therefore no new data will flow into Dashboards,
                      Analyses or Materialized Views.
                    </Typography>
                    <Typography>Users will still be able to use the application.</Typography>
                  </Box>
                }
                open={showConfirmBatch}
                placement="topRight"
                onCancel={toggleShowConfirmPauseProcessing}
                onConfirm={togglePauseProcessingStatus}
              >
                <StyledSwitchContainer>
                  <Switch
                    className={`${SWITCH_CLASSNAME}-${processingIsPaused ? 'unchecked' : 'checked'}`}
                    loading={updateBatchHaltLoading}
                    checked={!processingIsPaused}
                    checkedChildren="Live"
                    unCheckedChildren="Paused"
                    onChange={toggleShowConfirmPauseProcessing}
                  />
                </StyledSwitchContainer>
              </Popconfirm>
            )}
          </div>
        </Tooltip>
      )}

      {batchHaltedError && (
        <Box mt={2}>
          <Alert type="error" message={batchHaltedError?.message} />
        </Box>
      )}

      <Spin spinning={haltedByUserLoading}>
        {processingIsPaused && !isEmpty(processingLastPausedOn) && (
          <Box mt={1}>
            <Typography>By: {formattedPausedBy}</Typography>
            <Typography>When: {formatTimeStamp(processingLastPausedOn, company?.timezone, 'MMM Do, YYYY')}</Typography>
          </Box>
        )}
      </Spin>
    </Box>
  )
}

export default MonitorProcessingToggle

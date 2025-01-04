import { SyncOutlined } from '@ant-design/icons'
import { ResultProps } from 'antd/lib/result'
import { Progress, Result, Spin } from 'antd-next'
import { ProgressProps } from 'antd-next/es/progress'
import { Box, Flex } from 'components/shared/jawns'
import { isEmpty, sortBy } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { LoadingBarProps } from 'util/blocks/interfaces'
import { colors } from 'util/constants'
import usePrevious from 'util/usePrevious'

interface Props {
  loading?: boolean
  loadingBar?: LoadingBarProps[] | null
  error?: string
  children: React.ReactNode
}

// When showing the custom loader
// override antd's dot width and position to take full width
// and anchor to the left (so it doesn't expand the page horizontally)
const StyledSpinContainer = styled.div<{ showCustomIndicator: boolean }>`
  ${({ showCustomIndicator }) =>
    showCustomIndicator &&
    css`
      .antd5-spin-dot {
        width: 100% !important;
        left: 16px !important;
      }
    `}
`

const StyledInnerContent = styled(Box)`
  background-color: white;
  box-shadow:
    rgb(0 0 0 / 40%) -5px 6px 15px -9px,
    rgb(0 0 0 / 40%) 5px 6px 15px -9px;
  width: 100%;
  max-width: 560px;
`

const BlockLoadingBar = ({ loading, loadingBar, error, children }: Props) => {
  const [duration, setDuration] = useState(0)
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setTimeout>>()

  // force the modal to stay open to allow time for success messaging
  const [forceOpen, setForceOpen] = useState(false)

  // show success messaging for breif time after no longer loading
  const [showSuccess, setShowSuccess] = useState<boolean>()

  // BlockForm  clears loadingBar when "loading" is no longer true
  const prevLoadingBar = usePrevious(loadingBar)

  const sortedLoadingBar = useMemo(() => {
    return sortBy(loadingBar, 'duration')
  }, [loadingBar])

  const selectedLoadingBar = useMemo(() => {
    if (!isEmpty(sortedLoadingBar)) {
      // return loading bar step that meets duration threshold
      for (let i = sortedLoadingBar.length - 1; i >= 0; i--) {
        if (duration >= sortedLoadingBar[i].duration) {
          return sortedLoadingBar[i]
        }
      }
    }

    return null
  }, [sortedLoadingBar, duration])

  // handle duration/interval
  useEffect(() => {
    // start timer with new loading bar
    if (isEmpty(prevLoadingBar) && !isEmpty(loadingBar)) {
      const newIntervalId = setInterval(() => {
        setDuration((prevDuration) => prevDuration + 1)
      }, 1000)
      setForceOpen(true)
      setIntervalId(newIntervalId)
    }

    // reset duration and interval id when loading bar no longer present
    if (isEmpty(loadingBar) && !isEmpty(prevLoadingBar)) {
      setDuration(0)

      // start success UI
      setShowSuccess(true)
      // clear success UI after 1 second
      setTimeout(() => {
        setForceOpen(false)
        setShowSuccess(false)
      }, 1000)

      if (intervalId) {
        clearInterval(intervalId)
        setIntervalId(undefined)
      }
    }

    // cleanup: clear interval on dismount to stop memory leaks
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [prevLoadingBar, loadingBar, intervalId])

  // set Progress bar/ Result status/text
  let progressBarStatus = 'active'
  let resultStatus = 'info'
  let resultText = selectedLoadingBar?.text || sortedLoadingBar[0]?.text
  if (showSuccess) {
    progressBarStatus = 'success'
    resultStatus = 'success'
    resultText = 'Completed'
  }
  if (error) {
    progressBarStatus = 'exception'
    resultStatus = 'error'
    resultText = 'Something went wrong'
  }

  return (
    <StyledSpinContainer showCustomIndicator={forceOpen}>
      <Spin
        spinning={loading || forceOpen}
        size="large"
        indicator={
          forceOpen ? (
            <Flex style={{ height: '100%' }} justifyContent="center" alignItems="center" flexDirection="column">
              <StyledInnerContent p={3}>
                <Result
                  status={resultStatus as ResultProps['status']}
                  icon={
                    resultStatus !== 'success' && !error ? (
                      <SyncOutlined spin style={{ color: colors.blue500 }} />
                    ) : undefined
                  }
                  title={resultText}
                />

                <Box mt={2}>
                  <Progress
                    status={progressBarStatus as ProgressProps['status']}
                    // if success - show 100%
                    // if no step has been selected - start at 0%
                    // otherwise show selected percent
                    percent={showSuccess ? 100 : selectedLoadingBar?.percent || 0}
                    strokeWidth={14}
                  />
                </Box>
              </StyledInnerContent>
            </Flex>
          ) : undefined
        }
      >
        {children}
      </Spin>
    </StyledSpinContainer>
  )
}

export default BlockLoadingBar

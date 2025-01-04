import { SyncOutlined } from '@ant-design/icons'
import { Button, Modal, Progress, Result } from 'antd-next'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { isEmpty, sortBy } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { LoadingBarOption } from 'util/blocks/interfaces'
import { colors } from 'util/constants'
import { MavisError } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

interface Props {
  narrativeSlug: string
  visible: boolean // clicked assemble or intitial load
  saving: boolean
  assembling: boolean
  loadingFields: boolean
  loadingConfig: boolean
  error?: MavisError
  loadingBar?: LoadingBarOption[]
  onClose: () => void
  isDashboard?: boolean
}

const AssemblingModal = ({
  narrativeSlug,
  visible,
  saving,
  assembling,
  loadingFields,
  loadingConfig,
  error,
  loadingBar,
  onClose,
  isDashboard = false,
}: Props) => {
  const [hasShownInitialLoad, setHasShownInitialLoad] = useState(false)
  const [success, setSuccess] = useState(false)
  const prevSuccess = usePrevious(success)

  const [duration, setDuration] = useState(0)
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setTimeout>>()
  const prevVisible = usePrevious(visible)

  const [hasStartedAssembling, setHasStartedAssembling] = useState(false)
  const prevAssembling = usePrevious(assembling)

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

    // default show first step
    return sortedLoadingBar[0]
  }, [sortedLoadingBar, duration])

  // handle duration/interval
  useEffect(() => {
    // start timer with new loading bar
    if (!prevVisible && visible) {
      const newIntervalId = setInterval(() => {
        setDuration((prevDuration) => prevDuration + 1)
      }, 1000)

      setIntervalId(newIntervalId)
    }

    // cleanup: clear interval on dismount to stop memory leaks
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [prevVisible, visible, intervalId])

  // there is a brief gap between saving done and assembling started
  // capture assembling started so we don't show success state too early
  useEffect(() => {
    if (!prevAssembling && assembling) {
      setHasStartedAssembling(true)
    }
  }, [prevAssembling, assembling])

  const prevLoadingFields = usePrevious(loadingFields)

  // handle success state
  useEffect(() => {
    // handle initial load success (fields is last to be loaded)
    if (!hasShownInitialLoad) {
      if (!loadingConfig && prevLoadingFields && !loadingFields && !error && !saving && !assembling && !success) {
        return setSuccess(true)
      }

      // they haven't started initial load
      // don't check below for saving/assembled state
      return
    }

    // handle sucess of hitting run/assemble button
    if (!saving && hasStartedAssembling && !assembling && !error && !success) {
      // reset started assembling for next save/assemble
      setHasStartedAssembling(false)

      return setSuccess(true)
    }
  }, [
    hasShownInitialLoad,
    hasStartedAssembling,
    saving,
    assembling,
    loadingConfig,
    prevLoadingFields,
    loadingFields,
    error,
    success,
  ])

  // clear interval and reset duration on success
  useEffect(() => {
    if (!prevSuccess && success) {
      if (intervalId) {
        clearInterval(intervalId)
      }

      setDuration(0)
    }
  }, [prevSuccess, success, intervalId])

  // unset success when becoming visible again
  useEffect(() => {
    if (!prevVisible && visible && success) {
      setSuccess(false)
    }
  }, [prevVisible, visible, success])

  // we automatically want to close the modal
  // after showing initial loading state
  useEffect(() => {
    let delayTimer: NodeJS.Timeout | undefined

    if (!hasShownInitialLoad && success) {
      // close modal after a second so it's not so flashy
      delayTimer = setTimeout(() => {
        onClose()
        setHasShownInitialLoad(true)
      }, 1000)
    }

    return () => {
      if (delayTimer) {
        clearTimeout(delayTimer)
      }
    }
  }, [success, hasShownInitialLoad, onClose])

  if (!selectedLoadingBar) {
    return null
  }

  return (
    <Modal
      onCancel={onClose}
      open={visible}
      onOk={onClose}
      // don't show footer for initial load
      // (modal will close automatically)
      footer={!hasShownInitialLoad ? null : undefined}
      cancelButtonProps={{ style: { display: 'none' } }}
      data-test="narrative-assembling-modal"
    >
      <Box>
        {/* show loading state if no erros */}
        {!error && selectedLoadingBar && (
          <Box>
            <Result
              status={success ? 'success' : 'info'}
              icon={success ? undefined : <SyncOutlined spin style={{ color: colors.blue500 }} />}
              title={success ? 'Completed' : selectedLoadingBar.text}
            />

            <Box mt={2}>
              <Progress status="active" percent={success ? 100 : selectedLoadingBar?.percent || 0} strokeWidth={14} />
            </Box>
          </Box>
        )}

        {/* Don't show view narrative button if initial load */}
        {success && hasShownInitialLoad && (
          <Flex mt={2} justifyContent="center">
            <Link
              data-test="view-assembled-narrative-link"
              to={`/${isDashboard ? 'dashboards' : 'narratives'}/a/${narrativeSlug}`}
              target="_blank"
            >
              <Button type="primary">View {isDashboard ? 'Dashboard' : 'Narrative'}</Button>
            </Link>
          </Flex>
        )}

        {/* show errors if not assembling and errors */}
        {error && <ErrorResult error={error} />}
      </Box>
    </Modal>
  )
}

const ErrorResult = ({ error }: { error: MavisError }) => {
  // safety check
  if (!error) {
    return null
  }

  const description = error.description || 'Error Assembling'

  return (
    <Result
      status="error"
      title={
        <Box>
          <Typography type="title200" mb={2}>
            {description}
          </Typography>
          <Typography type="title300" mb={2}>
            {error.message}
          </Typography>
        </Box>
      }
    />
  )
}

export default AssemblingModal

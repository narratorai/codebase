import { SyncOutlined } from '@ant-design/icons'
import { Progress, Result } from 'antd-next'
import { Box, Flex } from 'components/shared/jawns'
import { isEmpty, sortBy } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { LoadingBarOption } from 'util/blocks/interfaces'
import { colors } from 'util/constants'
import usePrevious from 'util/usePrevious'

interface Props {
  onClose?: () => void
  success: boolean
  loading: boolean
  error?: Error
  loadingBar?: LoadingBarOption[]
}

const ProgressLoader = ({ onClose, success, loading, error, loadingBar }: Props) => {
  const prevLoading = usePrevious(loading)

  const [duration, setDuration] = useState(0)
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setTimeout>>()

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
    // start timer when starting to load
    if (!prevLoading && loading) {
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
  }, [prevLoading, loading, intervalId])

  // on success
  useEffect(() => {
    let delayTimer: NodeJS.Timeout | undefined

    if (success && onClose) {
      // close modal after a second
      delayTimer = setTimeout(() => {
        onClose()
      }, 1000)
    }

    // clean up timeout
    return () => {
      if (delayTimer) {
        clearTimeout(delayTimer)
      }
    }
  }, [success, onClose])

  return (
    <Flex justifyContent="center">
      <Box style={{ width: '100%', maxWidth: '500px' }}>
        {/* show loading state if no erros */}
        {!error && selectedLoadingBar && (success || loading) && (
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

        {/* show error */}
        {error && <Result status="error" title={error.message} />}
      </Box>
    </Flex>
  )
}

export default ProgressLoader

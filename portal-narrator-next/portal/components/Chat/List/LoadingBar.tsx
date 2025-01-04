import { CloseOutlined } from '@ant-design/icons'
import { Button, Flex, Progress, Tooltip } from 'antd-next'
import { Box, Typography } from 'components/shared/jawns'
import { forEach, isFunction } from 'lodash'
import { MessageTypes } from 'portal/stores/chats'
import { useEffect, useState } from 'react'
import { colors } from 'util/constants'

const CLASSIFIED_LOADING = [
  {
    percent: 20,
    duration: 10,
    text: 'Mavis is thinking through the problem',
  },
  {
    percent: 40,
    duration: 20,
    text: 'Getting the data it needs',
  },
  {
    percent: 60,
    duration: 35,
    text: 'Compiling the right dataset to answer this question',
  },
  {
    percent: 80,
    duration: 50,
    text: 'Sorry, our LLM is quite slow but this will get better soon',
  },
]

const DATASET_LOADING = [
  {
    percent: 20,
    duration: 6,
    text: 'Converting config to SQL',
  },
  {
    percent: 40,
    duration: 15,
    text: 'Running the SQL query on your data warehouse',
  },
  {
    percent: 60,
    duration: 30,
    text: 'Data is taking some time, but it is still running',
  },
  {
    percent: 80,
    duration: 48,
    text: 'Your warehouse might be under a lot of load so please keep waiting as your warehouse completes running the query',
  },
]

const DEFAULT_LOADING = [
  {
    percent: 20,
    duration: 5,
    text: 'Reading and understanding the message',
  },
  {
    percent: 40,
    duration: 12,
    text: 'Mavis AI is thinking through the problem',
  },
  {
    percent: 60,
    duration: 24,
    text: 'Getting more data',
  },
  {
    percent: 80,
    duration: 40,
    text: 'This is taking some time, but this will improve!',
  },
]

interface Props {
  messageType?: string
  onCancel?: () => void
}

const LoadingBar = ({ messageType, onCancel }: Props) => {
  let loadingConfig = DEFAULT_LOADING

  if (messageType === MessageTypes.ClassifiedQuestion) loadingConfig = CLASSIFIED_LOADING
  else if (messageType === MessageTypes.DatasetConfig) loadingConfig = DATASET_LOADING

  const [duration, setDuration] = useState(0)
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setTimeout>>()
  const [selectedLoadingBar, setSelectedLoadingBar] = useState(loadingConfig[0])

  // handle duration/interval
  useEffect(() => {
    // start timer with new loading bar
    if (!intervalId) {
      const newIntervalId = setInterval(() => {
        // eslint-disable-next-line max-nested-callbacks
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
  }, [intervalId])

  // handle selected loading bar
  useEffect(() => {
    let loadingBar

    // return loading bar step that meets duration threshold
    forEach(loadingConfig, (config) => {
      if (duration >= config.duration) {
        loadingBar = config
      }
    })

    // default show first step
    if (loadingBar) {
      setSelectedLoadingBar(loadingBar)
    }
  }, [duration, loadingConfig])

  if (!selectedLoadingBar) return null
  return (
    <Flex align="center">
      <Box style={{ width: '100%' }}>
        <Typography>{selectedLoadingBar.text}</Typography>
        <Progress status="active" percent={selectedLoadingBar.percent} strokeWidth={14} />
      </Box>

      {isFunction(onCancel) && (
        <Tooltip title="Cancel query">
          <Button
            onClick={onCancel}
            icon={<CloseOutlined style={{ color: colors.red500 }} />}
            style={{ marginLeft: '8px' }}
          />
        </Tooltip>
      )}
    </Flex>
  )
}

export default LoadingBar

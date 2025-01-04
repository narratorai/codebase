import { SyncOutlined } from '@ant-design/icons'
import { Progress, Result } from 'antd-next'
import { Box } from 'components/shared/jawns'
import { useEffect, useState } from 'react'
import { useInterval } from 'react-use'
import { colors } from 'util/constants'

const LoadingIcon = <SyncOutlined spin style={{ color: colors.blue500 }} />

interface Props {
  options: {
    percent: number
    duration: number
    text: string
  }[]
}

const ResultProgressLoader = ({ options }: Props) => {
  const [tick, setTick] = useState(0)
  const [loadingBar, setLoadingBar] = useState(options[0])
  const { text, percent } = loadingBar

  const getLoadingBar = (t: number) => {
    for (const config of options) {
      if (t <= config.duration) return config
    }
  }

  useInterval(() => setTick((tick) => tick + 1), 1000)

  useEffect(() => {
    const loadingBar = getLoadingBar(tick)
    if (loadingBar) setLoadingBar(loadingBar)
  }, [tick])

  return (
    <Box data-test="result-progress-loader">
      <Result status="info" icon={LoadingIcon} title={text} />
      <Box mt={2}>
        <Progress status="active" percent={percent} strokeWidth={14} />
      </Box>
    </Box>
  )
}

export default ResultProgressLoader

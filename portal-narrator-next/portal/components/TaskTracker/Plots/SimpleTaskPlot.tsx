import { Alert, Spin } from 'antd-next'
import DynamicPlot from 'components/shared/DynamicPlot'
import TaskTrackerContext from 'components/TaskTracker/TaskTrackerContext'
import { useContext, useEffect } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'

interface Props {
  plotSlug: string
}

/**
 * Like TaskExecutionPlot, but this has no ability to update the duration or resolution
 */
const SimpleTaskPlot = ({ plotSlug }: Props) => {
  const { duration, resolution, plotTime } = useContext(TaskTrackerContext)

  const [getTasks, { response, loading, error }] = useLazyCallMavis<any>({
    method: 'GET',
    path: '/v1/task_tracker/plot',
  })

  // fetch task info any time the duration, resolution, or plotSlug changes
  useEffect(() => {
    if (duration && resolution) {
      getTasks({
        params: {
          plot_slug: plotSlug,
          duration,
          resolution,
        },
      })
    }
  }, [duration, resolution, plotSlug])

  return (
    <Spin spinning={loading}>
      {error ? (
        <Alert type="error" message={error.message} />
      ) : (
        <DynamicPlot {...response?.value} useCompanyTimezone={plotTime === 'company_time'} forceRender />
      )}
    </Spin>
  )
}

export default SimpleTaskPlot

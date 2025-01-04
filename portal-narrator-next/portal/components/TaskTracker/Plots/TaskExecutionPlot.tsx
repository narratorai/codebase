import { InfoCircleOutlined } from '@ant-design/icons'
import { Alert, Empty, Radio, Spin, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import DynamicPlot from 'components/shared/DynamicPlot'
import { Box, Flex, Typography } from 'components/shared/jawns'
import TaskTrackerContext from 'components/TaskTracker/TaskTrackerContext'
import { ICompany_Task } from 'graph/generated'
import { isArray, isEmpty, isEqual } from 'lodash'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { getLocalTimezone, timezoneAbbreviation } from 'util/helpers'
import { useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import { TASK_CATEGORY_PROCESSING } from '../services/constants'
import TaskExecutionModal from '../TaskExecutionModal'

interface Props {
  taskType: string
  tasks?: ICompany_Task[]
  tabTitle?: string
}

const TaskExecutionPlot = ({ taskType, tasks, tabTitle }: Props) => {
  const company = useCompany()
  const { duration, resolution, plotTime, setPlotTime, handleUpdateDurationResolution } = useContext(TaskTrackerContext)

  const [clickedExecutionId, setClickedExecutionId] = useState<string | undefined>()
  const previousTasks = usePrevious(tasks)

  const [getExecution, { response: taskExecution, loading, error }] = useLazyCallMavis<any>({
    method: 'GET',
    path: '/v1/task_tracker/plot',
  })

  const handleGetExecution = useCallback(() => {
    if (duration && resolution && taskType) {
      getExecution({
        params: {
          plot_slug: taskType,
          duration,
          resolution,
        },
      })
    }
  }, [duration, resolution, taskType])

  // fetch execution data any time the duration, resolution, or taskType changes
  useEffect(() => {
    handleGetExecution()
  }, [handleGetExecution])

  // refetch execution data when tasks change
  useEffect(() => {
    if (tasks && previousTasks && !isEqual(tasks, previousTasks)) {
      handleGetExecution()
    }
  }, [previousTasks, tasks, handleGetExecution])

  const resetTaskExecutionClick = () => {
    setClickedExecutionId(undefined)
  }

  const rangeText =
    taskType === TASK_CATEGORY_PROCESSING
      ? 'Choose a date range for task executions, table updates, and query updates.'
      : 'Choose a date range for task executions'

  const handleClickThreeDays = () => {
    handleUpdateDurationResolution({ duration: 3, resolution: 'day' })
  }

  const handleClickOneWeek = () => {
    handleUpdateDurationResolution({ duration: 1, resolution: 'week' })
  }

  const handleClickOneMonth = () => {
    handleUpdateDurationResolution({ duration: 1, resolution: 'month' })
  }

  const handleClickUserLocalTime = () => {
    setPlotTime('user_time')
  }

  const handleClickCompanyLocalTime = () => {
    setPlotTime('company_time')
  }

  const userTimezoneAbrv = `(${timezoneAbbreviation(getLocalTimezone())})`
  const companyTimezoneAbrv = `(${timezoneAbbreviation(company.timezone)})`

  return (
    <Box mb={4}>
      {/*  Date Range Select */}
      <Flex justifyContent={tabTitle ? 'space-between' : 'flex-end'} alignItems="flex-start">
        {tabTitle && (
          <Typography type="title200" mr={1} style={{ width: '160px' }}>
            {tabTitle}
          </Typography>
        )}

        <Radio.Group buttonStyle="solid" value={plotTime}>
          <Radio.Button value="user_time" onClick={handleClickUserLocalTime}>
            Local Time {userTimezoneAbrv}
          </Radio.Button>
          <Radio.Button value="company_time" onClick={handleClickCompanyLocalTime}>
            Company Time {companyTimezoneAbrv}
          </Radio.Button>
        </Radio.Group>

        <Flex style={{ width: '248px' }} alignItems="center" ml={1}>
          <Radio.Group buttonStyle="solid" value={resolution}>
            <Radio.Button value="day" onClick={handleClickThreeDays}>
              3 Days
            </Radio.Button>
            <Radio.Button value="week" onClick={handleClickOneWeek}>
              1 Week
            </Radio.Button>
            <Radio.Button value="month" onClick={handleClickOneMonth}>
              1 Month
            </Radio.Button>
          </Radio.Group>

          <Box ml={1}>
            <Tooltip title={rangeText} placement="bottomLeft">
              <InfoCircleOutlined />
            </Tooltip>
          </Box>
        </Flex>
      </Flex>

      {/* Error Alert */}
      {error && (
        <Box mb={1}>
          <Alert type="error" message={error.message} />
        </Box>
      )}

      {/* Extra messaging */}
      {taskExecution?.details?.message && (
        <Typography type="body100" color="red500">
          {taskExecution?.details?.message}
        </Typography>
      )}

      {/* Plot */}
      <Flex alignItems="center" justifyContent="center" p={3} style={{ minHeight: 182 }}>
        <Box flexGrow={1}>
          <Spin spinning={loading}>
            {!loading && !error && (
              <DynamicPlot {...taskExecution?.value} useCompanyTimezone={plotTime === 'company_time'} />
            )}

            {/* TODO: add custom empty rendering option in DynamicPlot
                not currently using antV, but update when we do!
            */}
            {/* If you get a response, but data is an empty array, let user know */}
            {!isEmpty(taskExecution?.value?.layout) &&
              isEmpty(taskExecution?.value?.data) &&
              isArray(taskExecution?.value?.data) && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Sorry, there was no data for Task Executions"
                />
              )}
          </Spin>
        </Box>
      </Flex>

      {clickedExecutionId && <TaskExecutionModal executionId={clickedExecutionId} resetId={resetTaskExecutionClick} />}
    </Box>
  )
}

export default TaskExecutionPlot

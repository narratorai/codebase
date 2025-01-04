import { Modal, Spin, Tag } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { Box, Flex, Typography } from 'components/shared/jawns'
import {
  ITask_Execution,
  IWatcher_Relation_Enum,
  useGetTaskExecutionQuery,
  useListWatchersQuery,
} from 'graph/generated'
import { filter, find, startCase } from 'lodash'
import React, { useState } from 'react'

import { getStatusColor, IHoneyCombLink, makeTaskExecutionHoneycombLinks } from './services/helpers'
import TaskOrExecutionTable from './TaskOrExecutionTable'

interface TaskExecutionModalProps {
  executionId: string
  resetId: Function
}

const TaskExecutionModal: React.FC<TaskExecutionModalProps> = ({ executionId, resetId }) => {
  const { user } = useUser()
  const [isVisible, setIsVisible] = useState(true)
  const closeModal = () => {
    resetId()
    setIsVisible(false)
  }

  const {
    data: taskExecution,
    error,
    loading,
  } = useGetTaskExecutionQuery({
    variables: { execution_id: executionId },
    skip: !executionId,
  })

  // Grab all watchers so refetch will be consistent with Notifications page
  // - if you just grabbed watchers by company tasks, the Notifications page would not be updated
  // - when going from Processing -> Notifications
  const { data: watcherData, refetch: refetchWatchers } = useListWatchersQuery({
    variables: { user_id: user?.id },
  })

  // Filter to only have CompanyTask watchers
  const taskWatchers = filter(watcherData?.watcher, (watcher) => {
    if (watcher?.related_to === IWatcher_Relation_Enum.CompanyTask) {
      return true
    }

    return false
  })

  const isSubscribed = !!find(taskWatchers, ['related_id', taskExecution?.task_execution_by_pk?.task?.id])

  let honeycombLinks: IHoneyCombLink[] = []
  if (taskExecution?.task_execution_by_pk) {
    const links = makeTaskExecutionHoneycombLinks(taskExecution?.task_execution_by_pk as Partial<ITask_Execution>)
    if (links) {
      honeycombLinks = links as IHoneyCombLink[]
    }
  }

  const status = taskExecution?.task_execution_by_pk?.status!
  const statusColor = getStatusColor(status)

  return (
    <Modal title="Your Selected Task Execution" open={isVisible} onCancel={closeModal} footer={null}>
      <Spin spinning={loading}>
        {!error && (
          <>
            <Flex alignItems="center" mb={2}>
              <Typography type="title300">
                Task: {startCase(taskExecution?.task_execution_by_pk?.task?.task_slug)}
              </Typography>
              <Box ml={2}>
                <Tag color={statusColor} style={{ marginRight: '0' }}>
                  {status}
                </Tag>
              </Box>
            </Flex>
            <TaskOrExecutionTable
              id={taskExecution?.task_execution_by_pk?.id}
              task={taskExecution?.task_execution_by_pk?.task}
              execution={taskExecution?.task_execution_by_pk}
              startedAt={taskExecution?.task_execution_by_pk?.started_at}
              completedAt={taskExecution?.task_execution_by_pk?.completed_at}
              status={status}
              type="execution"
              honeycombLinks={honeycombLinks}
              isSubscribed={isSubscribed}
              refetchWatchers={refetchWatchers}
            />
          </>
        )}
        {error && (
          <Typography color="red500" type="body200">
            {error.message}
          </Typography>
        )}
      </Spin>
    </Modal>
  )
}

export default TaskExecutionModal

import { CloseOutlined, RedoOutlined } from '@ant-design/icons'
import { App, Badge, Button, Spin, Tooltip } from 'antd-next'
import { BadgeProps } from 'antd-next/es/badge'
import { ProtectedRoleLink } from 'components/context/auth/protectedComponents'
import { useCompany } from 'components/context/company/hooks'
import ResourceSearchSelect from 'components/shared/IndexPages/ResourceSearchSelect'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { getStatusColor } from 'components/TaskTracker/services/helpers'
import useCancelTaskExecution from 'components/TaskTracker/services/useCancelTaskExecution'
import { useGetLastRunTransformationSubscription } from 'graph/generated'
import { get, isEqual, map, startCase } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router'
import styled from 'styled-components'
import { breakpoints, colors } from 'util/constants'
import { timeFromNow } from 'util/helpers'
import { handleMavisErrorNotification, useLazyCallMavis } from 'util/useCallMavis'
import usePrevious from 'util/usePrevious'

import { TRANSFORMATION_HEADER_HEIGHT, TRANSFORMATION_HEADER_Z_INDEX } from './constants'
import { TransformationsFromQuery } from './interfaces'

const StyledLink = styled(Link)`
  color: ${colors.gray500};
  text-decoration: underline;
`

const SearchContainer = styled(Box)`
  width: 256px;

  @media only screen and (min-width: ${breakpoints.tablet}) {
    width: 480px;
  }

  @media only screen and (min-width: ${breakpoints.lg}) {
    width: 600px;
  }
`

interface Props {
  transformations?: TransformationsFromQuery
}

/**
 * Transformation Index Header
 */
const IndexHeader = ({ transformations }: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const history = useHistory()

  const [runNowDisabled, setRunNowDisabled] = useState(false)

  const { data: lastRunData, loading: lastRunLoading } = useGetLastRunTransformationSubscription({
    variables: { company_slug: company.slug },
  })

  const lastTaskExecution = get(lastRunData, 'task_execution[0]', {})
  const prevLastTaskExecution = usePrevious(lastTaskExecution)

  const lastCompletedAt = timeFromNow(lastTaskExecution.completed_at)
  const statusColor = getStatusColor(lastTaskExecution?.status)
  const runTransformationRunning = ['pending', 'running'].includes(lastTaskExecution?.status)

  useEffect(() => {
    // When you trigger "Run Transformations"
    // it takes the graph subscription a couple of seconds to update the task execution to "running"
    // show spinning icon until it's updated to running (then show the cancel option)
    if (!isEqual(lastTaskExecution, prevLastTaskExecution) && runNowDisabled) {
      setRunNowDisabled(false)
    }
  }, [lastTaskExecution, prevLastTaskExecution, runNowDisabled])

  // use "run transformation" task id to run transformations (createExecution)
  const [createExecution] = useLazyCallMavis<any>({
    method: 'POST',
    path: '/admin/v1/task/run',
    retryable: true,
  })

  const runTransformationId = lastTaskExecution?.task?.id
  const handleRunTransformations = useCallback(() => {
    if (!runNowDisabled && runTransformationId) {
      createExecution({ body: { task_id: runTransformationId } })
      setRunNowDisabled(true)
    }
  }, [createExecution, runTransformationId, runNowDisabled])

  const [cancelTaskExecution, { loading: cancelTaskExecutionLoading, error: cancelTaskExecutionError }] =
    useCancelTaskExecution()

  const handleCancelTask = useCallback(() => {
    cancelTaskExecution(lastTaskExecution.id)
  }, [cancelTaskExecution, lastTaskExecution?.id])

  useEffect(() => {
    if (cancelTaskExecutionError) {
      handleMavisErrorNotification({ error: cancelTaskExecutionError, notification })
    }
  }, [cancelTaskExecutionError, notification])

  const searchOptions = useMemo(
    () =>
      map(transformations, (tran) => ({
        key: `${tran.name}-${tran.id}`,
        value: tran.id,
        label: tran.name || startCase(tran.slug),
        extraSearchValues: tran.slug,
        optGroupBy: tran.table,
        resource: tran,
        hideResourceStateIcon: true,
      })),
    [transformations]
  )

  const handleSearchOnSelect = useCallback(
    (id: string) => {
      history.push(`/${company.slug}/transformations/edit/${id}`)
    },
    [company, history]
  )

  return (
    <Flex
      alignItems="baseline"
      justifyContent="space-between"
      style={{
        position: 'sticky',
        top: 0,
        height: TRANSFORMATION_HEADER_HEIGHT,
        zIndex: TRANSFORMATION_HEADER_Z_INDEX,
      }}
      mt={2}
    >
      <Flex>
        <Box mr={4}>
          <Typography type="title300">Transformations</Typography>

          {!lastRunLoading && lastCompletedAt && (
            <Spin spinning={cancelTaskExecutionLoading}>
              <Flex mt={2} alignItems="center">
                <Typography mr={1}>
                  {runTransformationRunning ? 'Running Transformations' : `Last updated ${lastCompletedAt}`}
                </Typography>{' '}
                <Tooltip title={lastTaskExecution?.status ? startCase(lastTaskExecution.status) : undefined}>
                  <Badge status={statusColor as BadgeProps['status']} style={{ marginRight: '8px' }} />
                </Tooltip>
                {runTransformationRunning ? (
                  <Tooltip title="Cancel Run Transformations">
                    <CloseOutlined onClick={handleCancelTask} />
                  </Tooltip>
                ) : (
                  <Tooltip title="Run Transformations">
                    <RedoOutlined onClick={handleRunTransformations} spin={runNowDisabled} />
                  </Tooltip>
                )}
              </Flex>
            </Spin>
          )}

          <StyledLink to="/manage/tasks">Manage processing</StyledLink>
        </Box>

        <SearchContainer mr={1}>
          <ResourceSearchSelect
            options={searchOptions}
            onSelect={handleSearchOnSelect}
            placeholderText="Search Transformations"
            isGrouped
            hideAvatarInOption
          />
        </SearchContainer>
      </Flex>

      <ProtectedRoleLink to={'/transformations/new'}>
        <Button type="primary" data-test="create-new-transformation-cta">
          Create New
        </Button>
      </ProtectedRoleLink>
    </Flex>
  )
}

export default IndexHeader

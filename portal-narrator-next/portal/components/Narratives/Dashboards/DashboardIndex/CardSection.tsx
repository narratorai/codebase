import { Button, Collapse } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { isNumber, map, slice } from 'lodash'
import React, { useContext, useEffect, useState } from 'react'
import usePrevious from 'util/usePrevious'

import DashboardCard from './DashboardCard'
import DashboardIndexContent from './DashboardIndexContext'
import { DashboardsType } from './interfaces'

const STARTING_SHOWABLE_DASHBOARD_COUNT = 12
const ADD_MORE_SHOWABLE_DASHBOARD_COUNT = 24

interface Props {
  title: string
  dashboards: DashboardsType
  icon?: React.ReactElement
}

const CardSection = ({ title, dashboards, icon }: Props) => {
  const [showableDashboardCount, setShowableDashboardCount] = useState(STARTING_SHOWABLE_DASHBOARD_COUNT)

  const { dashboardsDoneSuccessfullyLoading } = useContext(DashboardIndexContent)
  const prevDashboardsLength = usePrevious(dashboards?.length)

  // update showable dashboard count when dashboards update
  // i.e. if the user (un)favorites a dashboard (triggers refetch)
  useEffect(() => {
    // only update if the dashboards have re-fetched successfully
    if (isNumber(prevDashboardsLength) && dashboardsDoneSuccessfullyLoading) {
      // find the dashboard length that changed (can be positive or negative)
      const amountDashboardsLengthChanged = dashboards.length - prevDashboardsLength
      const newShowableDashboardCount = showableDashboardCount + amountDashboardsLengthChanged

      // update more/less shown dashboards accordingly
      setShowableDashboardCount(newShowableDashboardCount)
    }
  }, [showableDashboardCount, prevDashboardsLength, dashboards?.length, dashboardsDoneSuccessfullyLoading])

  const handleShowMore = () => {
    const newShowableDashboardCount = showableDashboardCount + ADD_MORE_SHOWABLE_DASHBOARD_COUNT

    setShowableDashboardCount(newShowableDashboardCount)
  }

  const handleShowLess = () => {
    setShowableDashboardCount(STARTING_SHOWABLE_DASHBOARD_COUNT)
  }

  const handleShowMoreOrLess = () => {
    if (showableDashboardCount >= dashboards.length) {
      handleShowLess()
    } else {
      handleShowMore()
    }
  }

  // only show the link if there are more dashboards than STARTING_SHOWABLE_DASHBOARD_COUNT
  const shouldShowMoreLink = dashboards.length > STARTING_SHOWABLE_DASHBOARD_COUNT
  const linkText = showableDashboardCount > dashboards.length ? 'Show Less' : 'Show More'

  // build showable dashboards based off of showableDashboardCount
  const dashboardsToShow = slice(dashboards, 0, showableDashboardCount)

  return (
    <Collapse defaultActiveKey={title} ghost>
      <Collapse.Panel
        key={title}
        header={
          <Flex alignItems="center">
            {icon && <Box mr={1}>{icon}</Box>}
            <Typography type="title400">{`${title} (${dashboards.length})`}</Typography>
          </Flex>
        }
      >
        <Box style={{ maxWidth: '100%' }}>
          <Flex flexWrap="wrap">
            {map(dashboardsToShow, (dashboard) => (
              <Box mb={2} mr={2} key={dashboard.id}>
                <DashboardCard dashboard={dashboard} />
              </Box>
            ))}
          </Flex>

          {shouldShowMoreLink && (
            <Flex justifyContent="center">
              <Button onClick={handleShowMoreOrLess} type="link">
                {linkText}
              </Button>
            </Flex>
          )}
        </Box>
      </Collapse.Panel>
    </Collapse>
  )
}

export default CardSection

import { ExperimentOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd-next'
import MaintenanceIcon from 'components/Activities/MaintenanceIcon'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { SHARED_ACTIVITY_NAME_QUERY_PARAM_KEY } from 'components/Datasets/DatasetIndexSection'
import { ALL_SHARED } from 'components/shared/IndexPages/constants'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { TRANSFORMATION_ACTIVITY_NAME_QUERY_PARAM_KEY } from 'components/Transformations/TransformationIndex/IndexTable'
import { IActivity_Maintenance } from 'graph/generated'
import { useFlags } from 'launchdarkly-react-client-sdk'
import { isEmpty } from 'lodash'
import { useCallback } from 'react'
import { useHistory } from 'react-router'
import DatasetIconSVG from 'static/svg/Narrator/Dataset.svg'
import TransformationIconSVG from 'static/svg/Narrator/Transformation.svg'
import styled from 'styled-components'
import { colors } from 'util/constants'

import ActivityFavoriteIcon from './ActivityFavoriteIcon'
import { Activity } from './interfaces'

export const ContainerCard = styled(Box)`
  &:hover {
    background-color: ${colors.blue100};
  }
`

export const StyledActivityOrDimLink = styled(Typography)`
  font-weight: 400;
  font-size: 16px;

  &:hover {
    cursor: pointer;
    color: ${colors.blue500};
  }
`

interface Props {
  activity: Activity
}

const ActivityCard = ({ activity }: Props) => {
  const history = useHistory()
  const company = useCompany()
  const { isCompanyAdmin } = useUser()
  const flags = useFlags()
  // favoriting activities is important for the new customer journey experience
  const showFavoriteActivityIcon = flags['customer-journey-v-3']

  const isUnderMaintenance = !isEmpty(activity.activity_maintenances)

  const openEditDrawer = useCallback(() => {
    if (activity?.id && isCompanyAdmin) {
      history.push(`/${company.slug}/activities/edit/${activity.id}`)
    }
  }, [company, history, activity?.id, isCompanyAdmin])

  const openExplore = useCallback(() => {
    if (activity?.id) {
      history.push(`/${company.slug}/activities/explorer/new?cohortActivity=${activity.id}`)
    }
  }, [company, history, activity?.id])

  return (
    <ContainerCard p={1}>
      {/* Name, Explore Link, and Edit Link */}
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" style={{ position: 'relative' }}>
          {isUnderMaintenance && (
            <Box mr={1} style={{ position: 'absolute', left: -24 }}>
              <MaintenanceIcon maintenance={activity.activity_maintenances?.[0] as IActivity_Maintenance} />
            </Box>
          )}
          <Tooltip
            title={isCompanyAdmin ? 'Edit Activity Details' : 'You must be an admin to edit'}
            placement="topLeft"
          >
            <StyledActivityOrDimLink onClick={openEditDrawer} mr={1}>
              {activity.name}
            </StyledActivityOrDimLink>
          </Tooltip>
        </Flex>

        <Flex alignItems="center" justifyContent="flex-end">
          {/* Dataset Count */}
          {activity?.datasets?.length > 0 && (
            <Tooltip title="Go to Datasets">
              <Flex alignItems="center" mr={1} style={{ minWidth: '32px' }}>
                <Flex alignItems="center">
                  <Link
                    to={`/datasets/${ALL_SHARED}?${SHARED_ACTIVITY_NAME_QUERY_PARAM_KEY}=${activity.name}`}
                    target="_blank"
                  >
                    <DatasetIconSVG style={{ color: colors.gray500 }} />
                  </Link>
                </Flex>
                <Typography ml="4px">{activity?.datasets?.length}</Typography>
              </Flex>
            </Tooltip>
          )}

          {/* Transformation Count */}
          {activity?.transformations?.length > 0 && (
            <Tooltip title="Go to Transformations">
              <Flex alignItems="center" mr={1}>
                <Link
                  to={`/transformations?${TRANSFORMATION_ACTIVITY_NAME_QUERY_PARAM_KEY}=${activity.name}`}
                  target="_blank"
                >
                  <TransformationIconSVG style={{ color: colors.gray500 }} />
                </Link>
                <Typography ml="4px">{activity?.transformations?.length}</Typography>
              </Flex>
            </Tooltip>
          )}

          <Tooltip title="Explore Activity">
            <div>
              <Button
                size="small"
                disabled={!isCompanyAdmin}
                onClick={openExplore}
                icon={<ExperimentOutlined style={{ color: colors.gray500 }} />}
              />
            </div>
          </Tooltip>

          {/* (un)Favorite activity */}
          {showFavoriteActivityIcon && (
            <div style={{ marginLeft: '8px' }}>
              <ActivityFavoriteIcon activity={activity} />
            </div>
          )}
        </Flex>
      </Flex>

      {/* Description */}
      {activity.description && (
        <Typography style={{ maxWidth: '360px', color: colors.gray500 }}>{activity.description}</Typography>
      )}
    </ContainerCard>
  )
}

export default ActivityCard

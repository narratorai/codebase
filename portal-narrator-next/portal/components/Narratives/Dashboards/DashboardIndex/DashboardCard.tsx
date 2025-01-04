import AssembledBadge from 'components/Narratives/shared/AssembledBadge'
import { Box, Flex } from 'components/shared/jawns'
import ResourceStateIcon from 'components/shared/ResourceStateIcon'
import { find } from 'lodash'
import { useContext } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

import DashboardImage, { CARD_HEIGHT, CARD_WIDTH } from './DashboardImage'
import DashboardIndexContext from './DashboardIndexContext'
import DashboardLink from './DashboardLink'
import DashboardMenu from './DashboardMenu'
import { DashboardType } from './interfaces'

const StyledContainer = styled(Box)`
  width: ${CARD_WIDTH}px;
  height: ${CARD_HEIGHT}px;
  padding: 8px;
  border-radius: 6px;
  background-color: ${colors.gray200};

  &:hover {
    background-color: ${colors.blue300};
  }
`

interface Props {
  dashboard: DashboardType
}

const DashboardCard = ({ dashboard }: Props) => {
  const { dashboardsImages, loadingDashboardImages } = useContext(DashboardIndexContext)

  const dashboardImage = find(dashboardsImages, ['id', dashboard.id])?.image
  const lastAssembled = dashboard?.narrative_runs[0]?.created_at

  return (
    <StyledContainer>
      {/* Top bar (avatar, link, info tooltip, favorite icon, options) */}
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="baseline">
          <Box mr={1}>
            <AssembledBadge narrative={dashboard} />
          </Box>

          {/* Dashboard name and link */}
          <DashboardLink lastAssembled={lastAssembled} dashboard={dashboard} />

          <Box ml={1}>
            <ResourceStateIcon state={dashboard.state} />
          </Box>
        </Flex>

        {/* Menu Options */}
        <DashboardMenu dashboard={dashboard} />
      </Flex>

      {/* Image or Placeholder*/}
      <DashboardImage
        image={dashboardImage}
        loadingDashboardImages={loadingDashboardImages}
        hasRuns={!!lastAssembled}
        dashboard={dashboard}
      />
    </StyledContainer>
  )
}

export default DashboardCard

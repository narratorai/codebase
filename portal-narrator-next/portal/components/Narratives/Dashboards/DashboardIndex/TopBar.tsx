import { Flex, Typography } from 'components/shared/jawns'

import { DASHBOARD_HEADER_Z_INDEX, DASHBOARD_INDEX_TOP_BAR_HEIGHT } from './constants'
import CreateNewNButton from './CreateNewButton'
import DashboardSearchBar from './DashboardSearchBar'

const TopBar = () => {
  return (
    <Flex
      alignItems="center"
      justifyContent="space-between"
      style={{ position: 'sticky', top: 0, height: DASHBOARD_INDEX_TOP_BAR_HEIGHT, zIndex: DASHBOARD_HEADER_Z_INDEX }}
    >
      <Flex alignItems="center">
        <Typography type="title300" mr={3}>
          Dashboards
        </Typography>

        <DashboardSearchBar />
      </Flex>

      <CreateNewNButton />
    </Flex>
  )
}

export default TopBar

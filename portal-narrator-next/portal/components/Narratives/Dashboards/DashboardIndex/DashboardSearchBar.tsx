import { useCompany } from 'components/context/company/hooks'
import { RECENTLY_VIEWED } from 'components/shared/IndexPages/constants'
import ResourceSearchSelect from 'components/shared/IndexPages/ResourceSearchSelect'
import { Box } from 'components/shared/jawns'
import { filter, find, isEmpty, map, sortBy } from 'lodash'
import { useContext, useMemo } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import DashboardIndexContent from './DashboardIndexContext'
import { DashboardsType } from './interfaces'

const SearchContainer = styled(Box)`
  width: 560px;

  @media only screen and (width <= 1100px) {
    width: 400px;
  }
`

const makeOptions = (dashboards?: DashboardsType) =>
  map(dashboards, (dashboard) => ({
    key: dashboard.id,
    label: dashboard.name,
    value: dashboard.slug,
    resource: dashboard,
  }))

const sortDashboardsByRecentlyViewed = (dashboards?: DashboardsType) => {
  // First sort by the user's recently viewed tag
  const recentlyViewedByUser = filter(
    dashboards,
    (dashboard) => !!find(dashboard.tags, ['company_tag.tag', RECENTLY_VIEWED])
  )
  const sortedRecentlyViewedByUser = sortBy(
    recentlyViewedByUser,
    (dashboard) => find(dashboard.tags, ['company_tag.tag', RECENTLY_VIEWED])?.updated_at
  ).reverse()

  // Then use whatever default sorting was passed down for dashboards
  // for non-recently viewed dashboards
  const notRecentlyViewedByUser = filter(
    dashboards,
    (dashboard) => !find(dashboard.tags, ['company_tag.tag', RECENTLY_VIEWED])
  )

  return [...sortedRecentlyViewedByUser, ...notRecentlyViewedByUser]
}

// TODO: this is VERY similar to DatasetSearchBar
// can we DRY this up?
const DashboardSearchBar = () => {
  const history = useHistory()
  const company = useCompany()
  const { allDashboards } = useContext(DashboardIndexContent)

  const handleSelect = (dashboardSlug: string) => {
    const selectedDashboard = find(allDashboards, ['slug', dashboardSlug])
    const hasAssembledRun = !isEmpty(selectedDashboard?.narrative_runs)

    // navigate to the either the assembled or edit dashboard page
    // depending on if there are any assembled runs available
    history.push(`/${company.slug}/dashboards/${hasAssembledRun ? 'a' : 'edit'}/${dashboardSlug}`)
  }

  const options = useMemo(() => {
    return makeOptions(sortDashboardsByRecentlyViewed(allDashboards))
  }, [allDashboards])

  return (
    <SearchContainer data-test="dashboard-search-bar">
      <ResourceSearchSelect
        options={options}
        onSelect={handleSelect}
        placeholderText="Search Dashboards"
        type="dashboard"
      />
    </SearchContainer>
  )
}

export default DashboardSearchBar

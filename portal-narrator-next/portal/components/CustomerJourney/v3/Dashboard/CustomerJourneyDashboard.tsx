import { InfoCircleOutlined } from '@ant-design/icons'
import { Flex, Layout, Tooltip, Typography } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { FAVORITES } from 'components/shared/IndexPages/constants'
import { Link } from 'components/shared/jawns'
import { LAYOUT_CONTENT_PADDING } from 'components/shared/layout/LayoutWithFixedSider'
import { useActivityIndexV2Query } from 'graph/generated'
import { compact, filter, find, map } from 'lodash'
import { useEffect, useState } from 'react'
import { usePrevious } from 'react-use'

import ActivityCards from './ActivityCards'
import AdditionalActivities from './AdditionalActivities'
import DayRange from './DayRange'
import { DayRangeValues } from './interfaces'

interface Props {
  onSelectCustomer: (customerEmail: string) => void
  tableId: string
}

// Shows favorited activities and allows you to select additional activities to view
const CustomerJourneyDashboard = ({ onSelectCustomer, tableId }: Props) => {
  const company = useCompany()
  const prevTableId = usePrevious(tableId)

  const [dayRange, setDayRange] = useState<DayRangeValues>(30)
  const handleSetDayRange = (value: DayRangeValues) => {
    setDayRange(value)
  }

  const { data: activitiesData } = useActivityIndexV2Query({
    variables: { company_slug: company.slug },
  })
  const activities = activitiesData?.all_activities
  // only show activities that belong to the selected table/activity stream
  const viewableActivities = filter(activities, (activity) => activity?.company_table?.id === tableId)

  const [additionalActivityIds, setAdditionalActivityIds] = useState<string[]>([])
  const handleAdditionActivitySelect = (id: string) => {
    setAdditionalActivityIds([...additionalActivityIds, id])
  }

  const additionalActivities = map(additionalActivityIds, (id) => find(viewableActivities, ['id', id]))

  // when the tableId changes, reset the additional activities (they are no longer relevant)
  useEffect(() => {
    if (prevTableId && tableId && prevTableId !== tableId) {
      setAdditionalActivityIds([])
    }
  }, [prevTableId, tableId])

  const favoritedActivities = filter(viewableActivities, (activity) => {
    return !!find(activity.tags, ['company_tag.tag', FAVORITES])
  })

  // only allow the user to select viewableActivities that aren't visible (addional activities + favorites)
  const activitiesForSearch = filter(viewableActivities, (activity) => {
    const isFavorited = !!find(favoritedActivities, ['id', activity.id])
    const isAdditional = !!find(additionalActivities, ['id', activity.id])

    return !isFavorited && !isAdditional
  })

  // compact to remove any undefined values
  // (can temporarily happen when switching activity streams)
  const activitiesForCards = compact([...favoritedActivities, ...additionalActivities])

  return (
    <Layout.Content style={{ height: '100%' }}>
      <Flex justify="space-between" style={{ padding: LAYOUT_CONTENT_PADDING }}>
        <Typography.Title level={4}>Customer Journey</Typography.Title>

        <DayRange value={dayRange} onChange={handleSetDayRange} />
      </Flex>

      <div
        style={{
          padding: LAYOUT_CONTENT_PADDING,
          height: '100%',
          overflowY: 'scroll',
          paddingBottom: '120px', // allows for the bottom content to be visible
        }}
      >
        <Flex align="center">
          <Typography.Title level={5} style={{ marginBottom: 0 }}>
            Get inspired by your favorite activities
          </Typography.Title>
          <div>
            <Tooltip
              title={
                <div>
                  You can favorite activities{' '}
                  <Link to={'/activities'} target="_blank">
                    here{' '}
                  </Link>
                </div>
              }
            >
              <InfoCircleOutlined style={{ marginLeft: '8px' }} />
            </Tooltip>
          </div>
        </Flex>

        <ActivityCards
          activities={activitiesForCards}
          tableId={tableId}
          dayRange={dayRange}
          onSelectCustomer={onSelectCustomer}
        />

        <AdditionalActivities onSelect={handleAdditionActivitySelect} activities={activitiesForSearch} />
      </div>
    </Layout.Content>
  )
}

export default CustomerJourneyDashboard

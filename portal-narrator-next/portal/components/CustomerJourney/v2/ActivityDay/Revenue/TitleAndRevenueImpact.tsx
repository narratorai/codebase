import { CopyOutlined } from '@ant-design/icons'
import { Popover } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { filter, isEmpty } from 'lodash'
import { colors, zIndex } from 'util/constants'
import { ordinalSuffixOf } from 'util/helpers'

import { ICustomerJourneyActivityRowWithMoment } from '../../services/interfaces'
import FeatureTable from '../FeatureTable'
import FeatureValues from '../FeatureValues'
import RevenueImpact from './RevenueImpact'
import Title from './Title'

interface Props {
  act: ICustomerJourneyActivityRowWithMoment
  toggleCollapse: () => void
  showRepeatedActivities?: boolean
  isSidebar: boolean
}

const TitleAndRevenueImpact = ({ act, toggleCollapse, showRepeatedActivities, isSidebar }: Props) => {
  const activityHasCopyOrLink = !isEmpty(filter(act.features, (feature) => feature.for_copy || feature.for_link))

  // if there are no features
  // just show title and revenue impact
  if (isEmpty(act.features)) {
    return (
      <Flex width={isSidebar ? '448px' : '560px'} alignItems="center">
        <Title act={act} toggleCollapse={toggleCollapse} showRepeatedActivities={showRepeatedActivities} />
        <RevenueImpact act={act} />

        {/* show ordinal for activities without repeated_activities */}
        {isEmpty(act.repeated_activities) && (
          <Typography
            color={act.activity_occurrence === 1 ? colors.green500 : colors.gray500}
            style={{ minWidth: '32px' }}
          >
            {ordinalSuffixOf(act.activity_occurrence)}
          </Typography>
        )}
      </Flex>
    )
  }

  return (
    <Flex width={isSidebar ? '448px' : '560px'}>
      {/* sidebar shows pop over with table */}
      {isSidebar ? (
        <>
          <Title
            act={act}
            toggleCollapse={toggleCollapse}
            showRepeatedActivities={showRepeatedActivities}
            isSidebar={isSidebar}
          />

          <RevenueImpact act={act} />

          {/* show ordinal for activities without repeated_activities */}
          {isEmpty(act.repeated_activities) && (
            <Typography
              color={act.activity_occurrence === 1 ? colors.green500 : colors.gray500}
              style={{ minWidth: '32px' }}
            >
              {ordinalSuffixOf(act.activity_occurrence)}
            </Typography>
          )}
        </>
      ) : (
        <>
          {/* main customer journey page
              shows features and buttons copy/link under title/revenue impact
          */}
          <Box>
            <Flex alignItems="center">
              <Title act={act} toggleCollapse={toggleCollapse} showRepeatedActivities={showRepeatedActivities} />
              <RevenueImpact act={act} />
              {/* show ordinal for activities without repeated_activities */}
              {isEmpty(act.repeated_activities) && (
                <Typography
                  color={act.activity_occurrence === 1 ? colors.green500 : colors.gray500}
                  style={{ minWidth: '32px' }}
                >
                  {ordinalSuffixOf(act.activity_occurrence)}
                </Typography>
              )}

              {isEmpty(act.repeated_activities) && activityHasCopyOrLink && (
                <Popover
                  content={<FeatureTable activity={act} onlyLinksAndCopy />}
                  placement="right"
                  zIndex={zIndex.notification}
                >
                  <Box ml={2} className="copy-and-link-icon">
                    <CopyOutlined style={{ color: colors.gray500 }} />
                  </Box>
                </Popover>
              )}
            </Flex>

            {isEmpty(act.repeated_activities) && <FeatureValues features={act.features} />}
          </Box>
        </>
      )}
    </Flex>
  )
}

export default TitleAndRevenueImpact

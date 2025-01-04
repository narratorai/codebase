import { DollarOutlined, InsertRowLeftOutlined } from '@ant-design/icons'
import { Popover, Tag, Tooltip } from 'antd-next'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import Mark from 'components/shared/Mark'
import { get, isEmpty, map, some, startCase, truncate } from 'lodash'
import { useMemo } from 'react'
import { semiBoldWeight } from 'util/constants'

import ActivityFeaturesTooltip, { IActivityWithFeatures, IColumnRename } from './ActivityFeaturesTooltip'
import { makeRowsOfThree } from './helpers'

interface Props {
  activity: IActivityWithFeatures
  searchValue: string
  activitiesCount: number
}

const ActivitySelectOption = ({ activity, searchValue, activitiesCount }: Props) => {
  const enrichedTable = get(activity, 'enriched_by[0].transformation')
  const enrichedColumns = enrichedTable?.column_renames

  const showAllContent = activitiesCount <= 50
  const showEnrichment = activitiesCount <= 100
  const showDescription = activitiesCount <= 200
  const onlyShowName = activitiesCount > 200

  let enrichedColumnsRows: any[][] = []
  // Build rows of 3 enrichment columns each
  // (Keeps spacing uniform)
  if (showEnrichment) {
    enrichedColumnsRows = makeRowsOfThree(enrichedColumns)
  }

  const activityFeatures = activity?.features || []
  let featureColumnsRows: IColumnRename[][] = []
  // Build rows of 3 feature columns each
  // (Keeps spacing uniform)
  if (showAllContent) {
    featureColumnsRows = makeRowsOfThree(activityFeatures)
  }

  const hasSpendColumn = useMemo(() => {
    return some(activity.column_renames, (col) => col.name === 'revenue_impact' && col.has_data)
  }, [activity])

  const activityName = activity?.name || ''

  return (
    // Override default "white-space: nowrap" in .antd5-select-item-option-content
    <Box py={1} style={{ width: '100%', minWidth: '480px', whiteSpace: 'normal' }}>
      <Flex>
        <Flex justifyContent="space-between" style={{ width: '100%' }}>
          <Typography
            fontWeight={semiBoldWeight}
            mb={1}
            data-public
            data-test="activity-name"
            title={activityName.length > 100 ? activityName : undefined}
          >
            <Mark value={truncate(activityName, { length: 100 })} snippet={searchValue} />
          </Typography>

          {!isEmpty(activity.company_category?.category) && (
            <Box>
              <Tag color={activity?.company_category?.color || 'default'}>
                {startCase(activity?.company_category?.category)}
              </Tag>
            </Box>
          )}
        </Flex>

        {/* generate features on hover only - when over 200 activities */}
        {/* and only show if they have either a description or features to show */}
        {onlyShowName && <ActivityFeaturesTooltip activity={activity} />}

        {!isEmpty(enrichedTable) && showEnrichment && (
          <Popover
            title="Enriched Activity"
            getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            content={
              <Box>
                The{' '}
                <b>
                  <Mark value={activity.name} snippet={searchValue} />
                </b>{' '}
                activity is enriched by the{' '}
                <Link target="_blank" to={`/transformations/edit/${enrichedTable.id}`}>
                  <b>
                    <Mark value={`${enrichedTable.name} (${enrichedTable.table})`} snippet={searchValue} />
                  </b>
                </Link>{' '}
                transformation.
              </Box>
            }
          >
            <Box ml={1}>
              <InsertRowLeftOutlined />
            </Box>
          </Popover>
        )}

        {hasSpendColumn && showAllContent && (
          <Box ml={1}>
            <Tooltip
              title="Has Revenue Columns"
              placement="right"
              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
            >
              <DollarOutlined />
            </Tooltip>
          </Box>
        )}
      </Flex>

      {activity.description && showDescription && (
        <Typography color="gray500" type="body200" mb={1} style={{ maxWidth: '480px' }} data-private>
          <Mark value={activity.description} snippet={searchValue} />
        </Typography>
      )}

      {!isEmpty(featureColumnsRows) && showAllContent && (
        <Box mt={2}>
          <Typography color="gray500" type="body400" fontWeight={semiBoldWeight}>
            Features:
          </Typography>
          {map(featureColumnsRows, (row) => (
            <Flex data-private key={`row-${row[0].id}`}>
              {map(row, (col) => (
                <Box width={1 / 3} mb={1} key={`col-${col.id}`}>
                  <Typography type="body200">
                    <Mark value={col.label} snippet={searchValue} />
                  </Typography>
                </Box>
              ))}
            </Flex>
          ))}
        </Box>
      )}

      {!isEmpty(enrichedColumnsRows) && showEnrichment && (
        <Box mt={2}>
          <Typography color="gray500" type="body400" fontWeight={semiBoldWeight}>
            Enrichment Columns:
          </Typography>
          {map(enrichedColumnsRows, (row) => (
            <Flex data-private key={`row-${row[0].id}`}>
              {map(row, (col) => (
                <Box width={1 / 3} mb={1} key={`col-${col.id}`}>
                  <Typography type="body200">
                    <Mark value={col.label} snippet={searchValue} />
                  </Typography>
                </Box>
              ))}
            </Flex>
          ))}
        </Box>
      )}
    </Box>
  )
}

export default ActivitySelectOption

import { InfoCircleOutlined } from '@ant-design/icons'
import { Popover } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { IActivity } from 'graph/generated'
import { filter, isEmpty, map, startsWith, truncate } from 'lodash'
import { useState } from 'react'
import { semiBoldWeight } from 'util/constants'

import { makeRowsOfThree } from './helpers'

export const getActivityFeatures = (activity: IActivity) =>
  filter(activity.column_renames, (col) => {
    if (col.name && startsWith(col.name, 'feature_') && col.has_data) {
      return col
    }
  })

export interface IColumnRename {
  has_data: boolean
  id: string
  label: string
  name: string
}

export interface IActivityWithFeatures extends IActivity {
  features?: IColumnRename[]
  feature_1?: { label: string }
  feature_2?: { label: string }
  feature_3?: { label: string }
}

interface Props {
  activity: IActivityWithFeatures
}

/**
 * Component used when there are over 200 activities.
 * Allows feature selection to be done on hover, instead of all of them on load.
 */
const ActivityFeaturesTooltip = ({ activity }: Props) => {
  const [featureColumnsRows, setFeatureColumnRows] = useState<IColumnRename[][]>()

  const makeFeatureColumnRows = () => {
    if (isEmpty(featureColumnsRows)) {
      const activityFeatures = getActivityFeatures(activity)
      setFeatureColumnRows(makeRowsOfThree(activityFeatures))
    }
  }

  return (
    <Popover
      title={<Typography type="title400">{truncate(activity?.name || '', { length: 100 })}</Typography>}
      getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
      content={
        <Box style={{ minWidth: '320px' }}>
          {activity.description && (
            <Typography type="body200" style={{ maxWidth: '480px' }} data-private>
              {activity.description}
            </Typography>
          )}

          {!isEmpty(featureColumnsRows) && (
            <Box mt={2}>
              <Typography type="body400" fontWeight={semiBoldWeight}>
                Features:
              </Typography>
              {map(featureColumnsRows, (row) => (
                <Flex data-private key={`row-${row[0].id}`}>
                  {map(row, (col) => (
                    <Box width={1 / 3} mb={1} key={`col-${col.id}`}>
                      <Typography type="body200">{col.label}</Typography>
                    </Box>
                  ))}
                </Flex>
              ))}
            </Box>
          )}
        </Box>
      }
    >
      {/* only make the feature columns on hover so we don't have to do it for the whole list */}
      <Box ml={1} onMouseEnter={makeFeatureColumnRows}>
        <InfoCircleOutlined />
      </Box>
    </Popover>
  )
}

export default ActivityFeaturesTooltip

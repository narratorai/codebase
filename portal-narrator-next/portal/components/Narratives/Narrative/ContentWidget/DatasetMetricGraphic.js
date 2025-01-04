import React from 'react'
import _ from 'lodash'
import styled from 'styled-components'

import { percentify, commaify, moneyify } from 'util/helpers'
import { Box, Flex, Typography, Link } from 'components/shared/jawns'
import { BEHAVIOR_COLOR_BG } from 'util/datasets'
import { useCompany } from 'components/context/company/hooks'
import { semiBoldWeight } from 'util/constants'

const GraphicWrapper = styled(Box)`
  width: 100%;
  min-height: 224px;
  border-radius: 8px;
  border: 1px solid;
  text-align: center;
  overflow-x: hidden;
`

const TitleWrapper = styled(Flex)`
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`

const DatasetMetricGraphic = ({
  currentValue,
  label,
  datasetSlug,
  groupSlug,
  lookups,
  columnMapping,
  format_type,
  title,
}) => {
  const company = useCompany()

  let formattedValue = currentValue
  // Check if user manually entered format_type
  if (format_type === 'revenue') {
    formattedValue = moneyify(formattedValue)
  } else if (format_type === 'percent') {
    formattedValue = percentify(formattedValue)
  }

  // check if number and make it pretty
  if (formattedValue && _.isFinite(_.toNumber(formattedValue))) {
    // check if it is a float and fix to 2 decimal places
    if (_.includes(_.toString(formattedValue), '.')) {
      formattedValue = formattedValue.toFixed(2)
    }
    // if it's a longer number, add commas
    formattedValue = commaify(formattedValue)
  }

  // if there isn't a formatted value or the formatted value is long, give it a smaller font
  const valueTitleSize = !formattedValue || _.toString(formattedValue).length > 20 ? 'body100' : 'title50'

  // if formattedValue doesn't have a space in it, break-all
  const valueTitleWordBreak =
    !formattedValue || _.includes(formattedValue, ' ') ? { wordWrap: 'break-word' } : { wordBreak: 'break-all' }

  const formattedLookups = _.map(lookups, (lookup) => {
    if (_.isEmpty(columnMapping)) return []

    const label = _.get(_.find(columnMapping, ['id', lookup.lookup_column_id]), 'label')
    return `${_.startCase(label)}: ${lookup.lookup_column_value}`
  })

  const joinedLookups = _.truncate(_.join(formattedLookups, ' & '), { length: 100 }) || null

  return (
    <GraphicWrapper pb="16px">
      <Flex flexDirection="column">
        <TitleWrapper justifyContent="center" bg={BEHAVIOR_COLOR_BG} mb="16px">
          <Typography type="title400" color="white" fontWeight={semiBoldWeight} p="16px">
            {title || _.startCase(groupSlug) || 'Your group name will be shown when the dataset successfully loads.'}
          </Typography>
        </TitleWrapper>

        <Flex justifyContent="center" flexDirection="column" mb="8px" px="8px">
          <Typography type="title400" mb="8px">
            {_.startCase(label) || 'Your label will be shown when the dataset successfully loads.'}
          </Typography>
          <Typography type="title400">{joinedLookups}</Typography>
        </Flex>

        <Flex justifyContent="center" px="8px" mb="8px" style={{ height: '100%', ...valueTitleWordBreak }}>
          <Typography type={valueTitleSize}>
            {formattedValue || 'Your value will be shown when the dataset successfully loads.'}
          </Typography>
        </Flex>

        <Box>
          <Link href={`/${company.slug}/datasets/edit/${datasetSlug}?group=${groupSlug}`} target="_blank">
            Source Dataset
          </Link>
        </Box>
      </Flex>
    </GraphicWrapper>
  )
}

export default DatasetMetricGraphic

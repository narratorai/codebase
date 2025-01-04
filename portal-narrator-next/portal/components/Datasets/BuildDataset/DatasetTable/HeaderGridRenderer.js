import { Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { connectToFormContext } from 'components/Datasets/BuildDataset/DatasetFormContext'
import ValueFormatter from 'components/shared/DataTable/ValueFormatter'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { get, isEmpty, map, slice, startsWith, truncate } from 'lodash'
import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import {
  COLUMN_CONTENT_WIDTH,
  COLUMN_KIND_CONVERSION,
  DEFAULT_X_PADDING,
  getColorByKind,
  HEADER_COLUMN_NAME_HEIGHT,
  HEADER_ROW_HEIGHT,
  HEADER_SECTION_TITLE_HEIGHT_V2,
} from 'util/datasets'

import ColumnRow from '../InfoPanel/ColumnRow'

const ColumnNameContainer = styled(({ borderColor, ...rest }) => <Flex {...rest} />)`
  @keyframes fade-in {
    0% {
      opacity: 0;
    }

    100% {
      opacity: 1;
    }
  }

  animation: 0.3s ease-out 0s 1 fade-in;
  height: ${HEADER_COLUMN_NAME_HEIGHT}px;
  min-height: ${HEADER_COLUMN_NAME_HEIGHT}px;
  border-bottom: 1px solid ${(props) => props.theme.colors[props.borderColor]};
  overflow: auto;
  white-space: normal;
`

const valueFormatter = new ValueFormatter()

const getMetricValue = ({ isApproximate, value, timezone, format }) => {
  const formattedValue = valueFormatter.formatValue(format, value, timezone)

  if (isApproximate) {
    return (
      <Tooltip title="Metrics are approximated using a sample of 30k rows. For exact values please compute the metrics using a group by tab.">
        {formattedValue + '*'}
      </Tooltip>
    )
  }

  return formattedValue
}

// Human readable names for metric labels!
const getMetricDisplayName = ({ columnConfig, metricsType, name }) => {
  if (metricsType === 'min_max') {
    if (name === 'min_time') {
      return 'MIN'
    }

    if (name === 'max_time') {
      return 'MAX'
    }
  }

  if (metricsType === 'percentile') {
    if (name === 'avg') {
      return 'Average'
    }

    if (name === 'median') {
      return 'Median'
    }

    if (name === 'twenty_five_percent') {
      return '25th Percentile'
    }

    if (name === 'seventy_five_percent') {
      return '75th Percentile'
    }
  }

  // Override the 1 and the 0 for the "converted_to" column so the metric makes more sense
  if (
    metricsType === 'distribution' &&
    columnConfig._kind === COLUMN_KIND_CONVERSION &&
    startsWith(columnConfig.query.id, 'converted_to_')
  ) {
    if (name === 0) {
      return 'Not Converted'
    }

    if (name === 1) {
      return 'Converted'
    }
  }

  if (!name & (name !== 0)) {
    return 'null'
  }

  return truncate(name, { length: 20 })
}

const ColumnMetric = ({ columnConfig, metricsType, timezone, name, value, format, isApproximate }) => {
  const color = columnConfig.metricsLoading ? 'gray500' : 'black'
  const displayName = getMetricDisplayName({ columnConfig, metricsType, name })

  return (
    <Flex justifyContent="space-between" mb="4px" width={COLUMN_CONTENT_WIDTH}>
      <Typography type="body300" color={color} title={name ? name : undefined}>
        {displayName}
      </Typography>

      <Typography type="body300" color={color}>
        {getMetricValue({ isApproximate, value, timezone, format })}
      </Typography>
    </Flex>
  )
}

const getHeaderGroupColor = (columnConfig) => {
  const columnKind = get(columnConfig, '_kind')
  return getColorByKind({ columnKind })
}

const HeaderGridRenderer = ({ activityStream, columnConfig, selectedApiData }) => {
  const company = useCompany()
  const isApproximate = selectedApiData?.is_approx

  const [renderExpensiveComponents, setRenderExpensiveComponents] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderExpensiveComponents(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  const renderContextArea = (columnConfig) => {
    const metricsLoading = get(columnConfig, 'metricsLoading', false)
    const metric = get(columnConfig, 'metric', {})
    const queryName = get(columnConfig, 'query.name')
    const isCustomer = queryName === 'customer' || queryName === 'join_customer'

    if (metricsLoading && isEmpty(metric)) {
      return <Typography type="body300">Loading...</Typography>
    }

    if (isEmpty(metric)) {
      return null
    }

    if (metric.metrics) {
      return map(slice(metric.metrics, 0, 5), (metricRow) => (
        <ColumnMetric
          activityStream={activityStream}
          columnConfig={columnConfig}
          isCustomer={isCustomer}
          columnType={metric.type}
          metricsType={metric.metrics_type}
          timezone={company.timezone}
          key={metricRow.name}
          name={metricRow.name}
          value={metricRow.value}
          format={metricRow.format}
          isApproximate={isApproximate}
        />
      ))
    }

    return null
  }

  const columnKind = get(columnConfig, '_kind')

  const typeColor = getColorByKind({ columnKind })
  const columnDefinition = columnConfig.query

  return (
    <Flex flexDirection="column" width="100%">
      <Box bg={getHeaderGroupColor(columnConfig)} style={{ height: `${HEADER_SECTION_TITLE_HEIGHT_V2}px` }} />
      <Flex css={{ height: `${HEADER_ROW_HEIGHT}px`, borderLeft: `1px solid ${colors.gray100}` }}>
        <Flex bg="white" flexDirection="column" width="100%">
          <ColumnNameContainer alignItems="center" justifyContent="space-between" borderColor={typeColor} px={2}>
            {!renderExpensiveComponents ? (
              columnDefinition.label
            ) : (
              <ColumnRow columnDefinition={columnDefinition} columnKind={columnKind} asHeader />
            )}
          </ColumnNameContainer>

          <Box flexGrow={1} px={`${DEFAULT_X_PADDING}px`} py="4px">
            {renderContextArea(columnConfig)}
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}

HeaderGridRenderer.propTypes = {
  activityStream: PropTypes.string.isRequired,
  data: PropTypes.array,
  obscureSensitiveInfo: PropTypes.bool.isRequired,
  style: PropTypes.shape({}),
}

export default connectToFormContext(HeaderGridRenderer)

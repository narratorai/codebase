import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons'
import { Collapse, Radio } from 'antd-next'
import { Title } from 'components/Datasets/BuildDataset/tools/shared'
import { Box, Flex, Typography } from 'components/shared/jawns'
import _ from 'lodash'
import PropTypes from 'prop-types'
import React, { useCallback } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'

import { MAX_PIVOTS_ALLOWED } from './constants'

const { Panel } = Collapse

const MetricRow = styled(Flex)`
  &:hover {
    background-color: ${colors.gray200};
  }
`

const StyledRow = styled(Flex)`
  border-bottom: 1px solid ${colors.gray400};
`

const DistinctValues = ({ pivotedMetrics, setOrderedPivotedMetrics, pivotValues }) => {
  const showablePivots = _.take(pivotValues, MAX_PIVOTS_ALLOWED)

  const handleMoveItemUp = useCallback(
    (index) => {
      const tempBefore = pivotedMetrics[index - 1]
      const tempCurrent = pivotedMetrics[index]

      let updatedMetrics = [...pivotedMetrics]
      updatedMetrics[index - 1] = tempCurrent
      updatedMetrics[index] = tempBefore

      setOrderedPivotedMetrics(updatedMetrics)
    },
    [pivotedMetrics, setOrderedPivotedMetrics]
  )

  const handleMoveItemDown = useCallback(
    (index) => {
      const tempAfter = pivotedMetrics[index + 1]
      const tempCurrent = pivotedMetrics[index]

      let updatedMetrics = [...pivotedMetrics]
      updatedMetrics[index + 1] = tempCurrent
      updatedMetrics[index] = tempAfter

      setOrderedPivotedMetrics(updatedMetrics)
    },
    [pivotedMetrics, setOrderedPivotedMetrics]
  )

  const handleDeleteItem = useCallback(
    (index) => {
      // remove item from pivotedMetrics at index
      let updatedMetrics = [...pivotedMetrics]
      updatedMetrics.splice(index, 1)
      setOrderedPivotedMetrics(updatedMetrics)
    },
    [pivotedMetrics, setOrderedPivotedMetrics]
  )

  return (
    <>
      {pivotValues.length > MAX_PIVOTS_ALLOWED && (
        <Typography type="body100" color="gray500" mb={2}>
          There are {pivotValues.length} distinct values. We'll only create pivoted columns for the top{' '}
          {MAX_PIVOTS_ALLOWED}.
        </Typography>
      )}

      <Box mb={4}>
        <Title mb={1}>Auto Generated Metric Columns</Title>

        {_.map(pivotedMetrics, (metric, index) => {
          const prevMetric = pivotedMetrics[index - 1]
          const firstMetric = _.get(metric, '_pre_pivot_column_id') !== _.get(prevMetric, '_pre_pivot_column_id')
          return (
            <Box mb={1} key={metric.id}>
              {firstMetric && (
                <Typography type="body300" color="gray500" mt={2} mb="4px">
                  {metric._pre_pivot_column_label}
                </Typography>
              )}

              <MetricRow alignItems="center" justifyContent="space-between">
                <Typography type="body200" mx="4px" style={{ overflowWrap: 'anywhere' }}>
                  {metric.label}
                </Typography>

                {/* high-jacking Radio.Group since Button.Group has been deprecated
                    give Radio.Group a fake value so all the buttons aren't blue
                    (let the buttons handle up/down/delete events)
                */}
                <Radio.Group value="not-a-real-value" size="small" style={{ minWidth: '90px' }} buttonStyle="solid">
                  <Radio.Button
                    onClick={() => handleMoveItemDown(index)}
                    disabled={index === pivotedMetrics.length - 1}
                  >
                    <ArrowDownOutlined />
                  </Radio.Button>

                  <Radio.Button onClick={() => handleMoveItemUp(index)} disabled={index === 0}>
                    <ArrowUpOutlined />
                  </Radio.Button>

                  <Radio.Button onClick={() => handleDeleteItem(index)}>
                    <DeleteOutlined style={{ color: colors.red500 }} />
                  </Radio.Button>
                </Radio.Group>
              </MetricRow>
            </Box>
          )
        })}
      </Box>

      <Box mb={3}>
        <Collapse ghost>
          <Panel key={0} header={<Title>Unique Values</Title>}>
            {_.map(showablePivots, (pivot) => (
              <StyledRow key={pivot} py={1}>
                <Typography type="body200" mr={2}>
                  {pivot || <i>null</i>}
                </Typography>
              </StyledRow>
            ))}
          </Panel>
        </Collapse>
      </Box>
    </>
  )
}

DistinctValues.propTypes = {
  pivotedMetrics: PropTypes.array.isRequired,
  pivotValues: PropTypes.array.isRequired,
  setOrderedPivotedMetrics: PropTypes.func.isRequired,
}

export default DistinctValues

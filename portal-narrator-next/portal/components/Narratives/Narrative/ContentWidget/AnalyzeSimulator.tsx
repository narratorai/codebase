import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd-next'
import { Divider } from 'components/antd/staged'
import { Box, Flex, Typography } from 'components/shared/jawns'
import { find, findIndex, round } from 'lodash'
import React, { useCallback, useState } from 'react'
import styled from 'styled-components'
import { AnalyzeSimulatorContent } from 'util/blocks/interfaces'
import { colors } from 'util/constants'

const SimulatedChange = styled(Flex)`
  background-image: url("data:image/svg+xml,<svg id='patternId' width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'><defs><pattern id='a' patternUnits='userSpaceOnUse' width='20' height='20' patternTransform='scale(1) rotate(135)'><rect x='0' y='0' width='100%' height='100%' fill='hsla(200, 71%, 55%, 1)'/><path d='M0 10h20z'   stroke-width='10' stroke='hsla(0, 0%, 90%, 1)' fill='none'/></pattern></defs><rect width='800%' height='800%' transform='translate(0,0)' fill='url(%23a)'/></svg>");

  .striped-percent-box {
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  &:hover {
    .striped-percent-box {
      opacity: 1;
    }
  }
`

const PercentTypography = styled(Typography)`
  font-size: 36px;

  &:hover {
    cursor: default;
  }
`

const formatToPercent = (num: number, roundBy = 0) => {
  return `${round(num * 100, roundBy)}%`
}

const AnalyzeSimulator: React.FC<AnalyzeSimulatorContent['value']> = ({ ...value }) => {
  // slider is broken into segments of 'percent_shift' (from simulations)
  // so use 'percent_shift' to find the selected simulation
  const [shiftPercent, setShiftPercent] = useState(value.default_shift_percent)

  // selectedSimulation changes when user clicks up/down arrows on the slider
  const selectedSimulation = find(value.simulations, ['percent_shift', shiftPercent])
  const isFirstSimulation = findIndex(value.simulations, ['percent_shift', selectedSimulation?.percent_shift]) === 0
  const isLastSimulation =
    findIndex(value.simulations, ['percent_shift', selectedSimulation?.percent_shift]) === value.simulations.length - 1

  // clicking "up" arrow in slider
  const handleIncreaseSimulation = useCallback(() => {
    // increase shift percent if it isn't the last
    if (!isLastSimulation) {
      // find the next shift percent and set it
      const selectedSimulationIndex = findIndex(value.simulations, ['percent_shift', selectedSimulation?.percent_shift])
      setShiftPercent(value.simulations[selectedSimulationIndex + 1].percent_shift)
    }
  }, [value.simulations, selectedSimulation, isLastSimulation])

  // clicking "down" arrow in slider
  const handleDescreaseSimulation = useCallback(() => {
    // decrease shift percent if it isn't the first
    if (!isFirstSimulation) {
      // find the previous shift percent and set it
      const selectedSimulationIndex = findIndex(value.simulations, ['percent_shift', selectedSimulation?.percent_shift])
      setShiftPercent(value.simulations[selectedSimulationIndex - 1].percent_shift)
    }
  }, [value.simulations, selectedSimulation, isFirstSimulation])

  // formattedShiftTo used to calculate other percents (so keep as number)
  const formattedShiftTo = round(value.shift_to_percent * 100, 0)
  const formattedShiftToPercent = formatToPercent(value.shift_to_percent)

  const formattedShiftPercent = formatToPercent(shiftPercent)

  // formattedShiftFrom used to calculate other percents (so keep as number)
  const formattedShiftFrom = 100 - formattedShiftTo - round(value.shift_from_percent * 100 * shiftPercent, 0)
  const formattedShiftFromPercent = `${formattedShiftFrom}%`
  const totalPossibleShiftFromPercent = formatToPercent(value.shift_from_percent)

  // the percent shown in box on hover of the striped area
  const stripedPercent = `${100 - formattedShiftTo - formattedShiftFrom}%`

  // used to show the "Relative Improvement"
  const formattedSelectedLift = formatToPercent(selectedSimulation?.lift || 0, 2)

  return (
    <Box py={2}>
      <Flex justifyContent="space-between">
        <Box width={1 / 2} pr={2}>
          <Typography type="title200" color={colors.gray600} mb={3}>
            KPI Assumptions
          </Typography>
          <Flex alignItems="center">
            <Typography type="title400" color={colors.gray600} mr={7}>
              Current {value.kpi_name}
            </Typography>
            <Typography type="title400" color={colors.gray600}>
              {value.current_kpi}
            </Typography>
          </Flex>
        </Box>

        <Box width={1 / 2} pl={2}>
          <Typography type="title300" color={colors.gray600} mb={2}>
            {value.kpi_name} By Group
          </Typography>

          <table style={{ width: '100%', border: `1px solid ${colors.gray200}` }}>
            <tbody>
              <tr style={{ backgroundColor: colors.gray100 }}>
                <td
                  style={{
                    backgroundColor: colors.gray400,
                    width: '16px',
                  }}
                />
                <td
                  style={{
                    paddingLeft: '8px',
                    paddingRight: '8px',
                    borderRight: `1px solid ${colors.gray200}`,
                  }}
                >
                  {value.shift_from_group}
                </td>
                <td
                  style={{
                    paddingLeft: '8px',
                    paddingRight: '8px',
                  }}
                >
                  {value.shift_from_kpi}
                </td>
              </tr>

              <tr>
                <td style={{ backgroundColor: colors.blue400, width: '16px' }} />
                <td style={{ paddingLeft: '8px', paddingRight: '8px', borderRight: `1px solid ${colors.gray200}` }}>
                  {value.shift_to_group}
                </td>
                <td style={{ paddingLeft: '8px', paddingRight: '8px' }}>{value.shift_to_kpi}</td>
              </tr>
            </tbody>
          </table>
        </Box>
      </Flex>

      <Box my={5}>
        <Divider />
      </Box>

      <Flex justifyContent="space-between" mb={4}>
        <Typography type="title200" color={colors.gray600} style={{ minWidth: '224px' }}>
          Simulated Impact
        </Typography>
        <Typography style={{ textAlign: 'right' }} color={colors.gray600}>
          Shifting from {value.shift_from_group} to {value.shift_to_group}{' '}
        </Typography>
      </Flex>

      <Flex justifyContent="center" mb={4}>
        <Box mr={4}>
          <Typography mb={1}>Current {value.kpi_name}</Typography>
          <PercentTypography type="title50" color={colors.blue400} textAlign="center">
            {value.current_kpi}
          </PercentTypography>
        </Box>
        <Box ml={4}>
          <Typography mb={1}>Simulated {value.kpi_name}</Typography>
          <PercentTypography type="title50" color={colors.blue400} textAlign="center">
            {selectedSimulation?.simulated_kpi}
          </PercentTypography>
        </Box>
      </Flex>

      <Box mb={5}>
        <Flex justifyContent="center" alignItems="center" mb={2}>
          <Typography type="title200" color={colors.gray700} mr={3}>
            Relative Improvement
          </Typography>
          <PercentTypography type="title100" color={colors.green500}>
            {formattedSelectedLift}
          </PercentTypography>
        </Flex>
        <Typography textAlign="center" color={colors.gray600}>
          Assuming a {formattedShiftPercent} shift in volume from {value.shift_from_group} to {value.shift_to_group}
        </Typography>
      </Box>

      <Box mb={3}>
        <Typography type="title200" color={colors.gray600} mb={2}>
          Simulation
        </Typography>
      </Box>

      <Box pl={2}>
        <Flex justifyContent="space-between" mb={1}>
          <Typography color={colors.gray600}>{value.shift_to_group}</Typography>
          <Typography color={colors.gray600}>{value.shift_from_group}</Typography>
        </Flex>
        <Flex style={{ height: '48px' }} mb={2}>
          <Flex
            justifyContent="center"
            alignItems="center"
            style={{ backgroundColor: colors.blue400, width: formattedShiftToPercent }}
          >
            <Typography type="title200" color="white">
              {formattedShiftToPercent}
            </Typography>
          </Flex>
          <Flex width={totalPossibleShiftFromPercent}>
            <Tooltip
              getPopupContainer={(trigger) => trigger.parentNode as HTMLElement}
              title={`You're shifting ${stripedPercent} of ${value.row_label}s into ${value.shift_to_group}, which represents ${formattedShiftPercent} of ${value.row_label}s from ${value.shift_from_group}`}
            >
              <SimulatedChange
                justifyContent="center"
                alignItems="center"
                style={{ width: `${(selectedSimulation?.percent_shift || 0) * 100}%` }}
              >
                <Flex
                  className="striped-percent-box"
                  alignItems="center"
                  style={{
                    backgroundColor: 'white',
                    height: '100%',
                    overflow: 'hidden',
                    borderRadius: '3px',
                    border: `${colors.gray600} solid 1px`,
                  }}
                >
                  <Typography type="title200">{stripedPercent}</Typography>
                </Flex>
              </SimulatedChange>
            </Tooltip>
            <Flex
              justifyContent="center"
              alignItems="center"
              style={{
                backgroundColor: colors.gray300,
                width: `${100 - (selectedSimulation?.percent_shift || 0) * 100}%`,
              }}
            >
              <Typography type="title200" color="white" style={{ overflow: 'hidden' }}>
                {formattedShiftFromPercent}
              </Typography>
            </Flex>
          </Flex>
        </Flex>

        <Typography color={colors.gray700} mb={2}>
          Adjust the volume in each segment to see how the impact changes
        </Typography>

        <Flex alignItems="center">
          <Typography type="title400" mr={3}>
            Shifted Volume
          </Typography>
          <PercentTypography type="title50" color={colors.blue400} style={{ minWidth: '72px' }}>
            {formattedShiftPercent}
          </PercentTypography>
          <Flex ml={2}>
            <Box mr={1}>
              <Button icon={<ArrowDownOutlined />} disabled={isFirstSimulation} onClick={handleDescreaseSimulation} />
            </Box>
            <Box>
              <Button icon={<ArrowUpOutlined />} disabled={isLastSimulation} onClick={handleIncreaseSimulation} />
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Box>
  )
}

export default AnalyzeSimulator

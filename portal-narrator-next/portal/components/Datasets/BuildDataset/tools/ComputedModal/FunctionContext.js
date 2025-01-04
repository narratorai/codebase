import { Box, Typography } from 'components/shared/jawns'
import _ from 'lodash'
import PropTypes from 'prop-types'
import styled from 'styled-components'
import { semiBoldWeight } from 'util/constants'

import { getAllComputedConfigs } from './computedConstants'
import ExampleTable from './ExampleTable'

export const HeaderLabel = (props) => (
  <Typography type="body300" color="gray500" mb="4px" css={{ textTransform: 'uppercase' }} {...props} />
)

const BottomBorder = styled(Box)`
  border-bottom: 1px solid ${(props) => props.theme.colors.gray400};
`

const FunctionContext = ({ activeKind }) => {
  const kinds = getAllComputedConfigs()
  const kindObj = _.find(kinds, ['kind', activeKind])

  if (!kindObj) {
    return (
      <Box px={3}>
        <HeaderLabel>Information</HeaderLabel>

        <Typography type="body100" color="gray800" fontWeight={semiBoldWeight} mb={2}>
          Computed Columns
        </Typography>

        <Typography type="title400" color="gray800" mb={2}>
          Select which type of Computation you're looking for
        </Typography>

        <Typography type="body100" color="gray600">
          (Hover to see more info)
        </Typography>
      </Box>
    )
  }

  return (
    <>
      <Box px={3}>
        <Box mb={2}>
          <HeaderLabel mb={1}>Information</HeaderLabel>

          <Typography type="title400" mb={1}>
            {kindObj.label}
          </Typography>

          {/* add break-spaces to allow /n in computed descriptions */}
          <Typography color="blue900" type="body100" mb={2} style={{ whiteSpace: 'break-spaces' }}>
            {kindObj.description}
          </Typography>

          <HeaderLabel>Value Type</HeaderLabel>

          <Typography color="blue900" type="body100">
            {kindObj.valueType}
          </Typography>
        </Box>
      </Box>

      <BottomBorder my={3} />

      <Box px={3}>
        <Box mb={2}>
          <HeaderLabel>SQL</HeaderLabel>

          <Typography color="blue900" type="body200">
            {kindObj.sql}
          </Typography>
        </Box>

        <Box>
          <HeaderLabel>Example</HeaderLabel>

          <Typography color="blue900" type="body200" mb={2}>
            {kindObj.example}
          </Typography>

          <ExampleTable {...kindObj.exampleTable} />
        </Box>
      </Box>
    </>
  )
}

FunctionContext.propTypes = {
  activeKind: PropTypes.string,
}

export default FunctionContext

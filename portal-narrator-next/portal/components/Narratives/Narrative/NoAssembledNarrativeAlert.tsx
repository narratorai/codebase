import { Button, Empty } from 'antd-next'
import { Box, Flex, Typography } from 'components/shared/jawns'
import styled from 'styled-components'
import { colors } from 'util/constants'

interface Props {
  handleRunNarrative: () => void
  isDashboard?: boolean
}

const EMPTY_HEADER_CLASSNAME = 'empty-header'
const EMPTY_SUBHEADER_CLASSNAME = 'empty-sub-header'

const EmptyDescriptionContainer = styled(Box)`
  .${EMPTY_HEADER_CLASSNAME} {
    color: ${colors.gray700} !important;
  }

  .${EMPTY_SUBHEADER_CLASSNAME} {
    color: ${colors.gray500} !important;
  }
`

const NoAssembledNarrativeAlert = ({ handleRunNarrative, isDashboard }: Props) => {
  return (
    <Flex justifyContent="center" style={{ width: '100%' }} mt={5}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <EmptyDescriptionContainer>
            <Typography mb={1} className={EMPTY_HEADER_CLASSNAME}>{`This ${
              isDashboard ? 'Dashboard' : 'Analysis'
            } hasn't been assembled yet.`}</Typography>

            <Typography mb={3} className={EMPTY_SUBHEADER_CLASSNAME}>
              It may still be running or require a manual run to assemble the first version.
            </Typography>

            <Button type="primary" onClick={handleRunNarrative}>
              Run Now
            </Button>
          </EmptyDescriptionContainer>
        }
      />
    </Flex>
  )
}

export default NoAssembledNarrativeAlert

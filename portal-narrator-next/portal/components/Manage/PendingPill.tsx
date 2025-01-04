import { Flex, Typography } from 'components/shared/jawns'

const PendingPill = () => (
  <Flex
    px="8px"
    bg="magenta600"
    css={{ borderRadius: '12px', height: '16px' }}
    justifyContent="center"
    alignItems="center"
  >
    <Typography type="body400" color="white">
      Pending Approval
    </Typography>
  </Flex>
)

export default PendingPill

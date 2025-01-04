import ViewStripeButton from 'components/Manage/Company/ViewStripeButton'
import { Box, Flex, Typography } from 'components/shared/jawns'

const Billing = () => {
  return (
    <Flex justifyContent="center" mt={6}>
      <Box>
        <Typography textAlign="center" type="title300" mb={2}>
          Our billing is powered by Stripe.
        </Typography>

        <Typography textAlign="center" mb={3}>
          You can view your billing information by clicking the button below.
        </Typography>

        <Flex justifyContent="center">
          <ViewStripeButton />
        </Flex>
      </Box>
    </Flex>
  )
}

export default Billing

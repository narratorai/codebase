import { Flex } from 'antd-next'
import { Typography } from 'components/shared/jawns'
import Image from 'next/image'
import celebrationLogo from 'static/img/celebration.png'
import { colors } from 'util/constants'

const NoOutstandingRequests = () => {
  return (
    <Flex justify="center">
      <div style={{ padding: '24px' }}>
        <Image src={celebrationLogo} alt="No more requests" style={{ width: '320px' }} />

        <Typography
          mt={2}
          type="title300"
          style={{ color: colors.mavis_text_gray, fontWeight: 600, textAlign: 'center' }}
        >
          Congratulations!
        </Typography>
        <Typography mt={1} style={{ color: colors.mavis_text_gray, textAlign: 'center' }}>
          All requests are complete.
        </Typography>
      </div>
    </Flex>
  )
}

export default NoOutstandingRequests

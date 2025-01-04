import { Flex, Space } from 'antd-next'
import { colors } from 'util/constants'

import CompleteButton from './CompleteButton'
import { ViewRequest } from './interfaces'
import SkipButton from './SkipButton'

interface Props {
  request: ViewRequest
}

const QuestionFooter = ({ request }: Props) => {
  if (request.status === 'completed') return null
  return (
    <Flex
      justify="center"
      align="center"
      style={{ minHeight: '94px', height: '94px', borderTop: `1px solid ${colors.mavis_light_gray}` }}
    >
      <Space size={8}>
        <SkipButton request={request} />
        <CompleteButton request={request} />
      </Space>
    </Flex>
  )
}

export default QuestionFooter

import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons'
import { Popconfirm, Radio } from 'antd-next'
import { Flex } from 'components/shared/jawns'
import React from 'react'
import { colors } from 'util/constants'

import ConditionalContent from './ConditionalContent'

interface Props {
  handleDelete: () => void
  fieldName: string
  moveUp: () => void
  moveDown: () => void
  index: number
  isLast: boolean
}

const TakeawayOptions = ({ handleDelete, fieldName, moveUp, moveDown, isLast, index }: Props) => {
  return (
    <Flex justifyContent="flex-end" data-index={index} data-test="takeaway-options">
      {/* high-jacking Radio.Group since Button.Group has been deprecated
          give Radio.Group a fake value so all the buttons aren't blue
          (let the buttons handle up/down/delete events)
      */}
      <Radio.Group value="not-a-real-value" size="small" buttonStyle="solid">
        <Radio.Button onClick={moveDown} disabled={isLast}>
          <ArrowDownOutlined />
        </Radio.Button>

        <Radio.Button onClick={moveUp} disabled={index === 0}>
          <ArrowUpOutlined />
        </Radio.Button>

        <Radio.Button>
          {/* No popContainer b/c input overridden by Radio events */}
          <ConditionalContent fieldName={fieldName} contentType="takeaway" withoutPopContainer />
        </Radio.Button>

        <Radio.Button>
          <Popconfirm title={'Delete takeaway?'} onConfirm={handleDelete}>
            <DeleteOutlined style={{ color: colors.red500 }} />
          </Popconfirm>
        </Radio.Button>
      </Radio.Group>
    </Flex>
  )
}

export default TakeawayOptions

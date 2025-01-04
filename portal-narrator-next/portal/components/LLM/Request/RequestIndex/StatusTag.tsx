import { Tag } from 'antd-next'
import { ITrainining_Request_Status_Enum } from 'graph/generated'
import { colors } from 'util/constants'

const StatusTag = ({ status }: { status: ITrainining_Request_Status_Enum[number] }) => {
  let color = colors.mavis_light_purple // default outstanding (new)
  if (status === ITrainining_Request_Status_Enum.Completed) color = colors.mavis_black
  if (status === ITrainining_Request_Status_Enum.Skipped) color = colors.mavis_text_gray

  let text = 'Outstanding' // default outstanding (new)
  if (status === ITrainining_Request_Status_Enum.Completed) text = 'Completed'
  if (status === ITrainining_Request_Status_Enum.Skipped) text = 'Skipped'

  return <Tag color={color}>{text}</Tag>
}

export default StatusTag

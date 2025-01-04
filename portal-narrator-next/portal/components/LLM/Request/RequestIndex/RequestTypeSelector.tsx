import { Badge, Flex, Radio } from 'antd-next'
import { useUser } from 'components/context/user/hooks'
import { ITrainining_Request_Status_Enum } from 'graph/generated'
import { filter } from 'lodash'
import styled from 'styled-components'
import { colors } from 'util/constants'

import { Requests, VisibleRequestTypes } from '../interfaces'

const Container = styled.div`
  width: fit-content;
  padding: 4px;
  background-color: ${colors.mavis_light_gray};
  border-radius: 8px;

  .antd5-radio-button-wrapper {
    background-color: ${colors.mavis_light_gray};
    border: none;

    ::before,
    ::after {
      background-color: transparent !important;
    }

    &:hover {
      color: rgb(0 0 0 / 88%);
    }
  }

  .antd5-radio-button-wrapper-checked {
    background-color: white;
    color: rgb(0 0 0 / 88%);
    border-radius: 6px;

    ::before,
    ::after {
      background-color: transparent;
    }
  }
`

interface ButtonLabelProps {
  type: VisibleRequestTypes
  count: number
  selected: boolean
}

const ButtonLabel = ({ type, count, selected }: ButtonLabelProps) => {
  let text = 'All'
  if (type === VisibleRequestTypes.MyOutstanding) text = 'My Outstanding'
  if (type === VisibleRequestTypes.Outstanding) text = 'Outstanding'

  return (
    <Flex align="center">
      {text}
      <Badge
        count={count}
        style={{ marginLeft: 8 }}
        color={selected ? colors.mavis_black : colors.mavis_text_gray}
        size="small"
      />
    </Flex>
  )
}
interface Props {
  onChange: (type: VisibleRequestTypes) => void
  selectedType: VisibleRequestTypes
  requests: Requests
}

const RequestTypeSelector = ({ selectedType, onChange, requests }: Props) => {
  const { companyUser } = useUser()

  const allRequestsCount = requests.length
  const outstandingRequestsCount = filter(
    requests,
    (request) => request.status === ITrainining_Request_Status_Enum.New
  ).length
  const myOutstandingRequestsCount = filter(
    requests,
    (request) =>
      request.status === ITrainining_Request_Status_Enum.New &&
      request.assignee?.company_users?.[0]?.id === companyUser?.id
  ).length

  const handleChange = (e: any) => {
    onChange(e.target.value)
  }

  return (
    <Container>
      <Radio.Group value={selectedType} onChange={handleChange} size="small">
        <Radio.Button value={VisibleRequestTypes.Outstanding}>
          <ButtonLabel
            type={VisibleRequestTypes.Outstanding}
            count={outstandingRequestsCount}
            selected={selectedType === VisibleRequestTypes.Outstanding}
          />
        </Radio.Button>
        <Radio.Button value={VisibleRequestTypes.MyOutstanding}>
          <ButtonLabel
            type={VisibleRequestTypes.MyOutstanding}
            count={myOutstandingRequestsCount}
            selected={selectedType === VisibleRequestTypes.MyOutstanding}
          />
        </Radio.Button>
        <Radio.Button value={VisibleRequestTypes.All}>
          <ButtonLabel
            type={VisibleRequestTypes.All}
            count={allRequestsCount}
            selected={selectedType === VisibleRequestTypes.All}
          />
        </Radio.Button>
      </Radio.Group>
    </Container>
  )
}

export default RequestTypeSelector

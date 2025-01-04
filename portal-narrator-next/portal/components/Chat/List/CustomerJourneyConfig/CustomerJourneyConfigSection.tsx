import { Flex, Spin, Switch } from 'antd-next'
import { IMessage, useChat } from 'portal/stores/chats'
import styled, { css } from 'styled-components'
import { useLazyCallMavis } from 'util/useCallMavis'

import CustomerJourneyConfig from './CustomerJourneyConfig'
import { FormValues } from './CustomerJourneyConfig'

// In View mode:
// 1) Hide the add Join Activity and add Column Filter buttons
// 2) disable pointer events (can't interact with the dataset definition)
const CustomerJourneyConfigWrapper = styled.div<{ isViewMode: boolean }>`
  ${({ isViewMode }) =>
    isViewMode &&
    css`
      pointer-events: none;
    `}
`

interface Props {
  message: IMessage
  chatId: string
  isViewMode: boolean
  toggleMode: () => void
}

const CustomerJourneyConfigSection = ({ message, chatId, isViewMode, toggleMode }: Props) => {
  const [setMessages] = useChat((state) => [state.setMessages])

  const defaultValues = {
    customer: message.data?.customer as string,
    limit_activities: [],
    from_time: message.data?.from_time as string | null,
    to_time: message.data?.to_time as string | null,
  }

  const [updateCustomerMessage, { loading: updateCustomerMessageLoading }] = useLazyCallMavis<{ messages: IMessage[] }>(
    {
      method: 'PATCH',
      path: `/v1/chat/${chatId}/messages/${message.id}`,
    }
  )

  const handleSubmit = async (formValues: FormValues) => {
    const updatedMessage = {
      ...message,
      data: {
        ...message.data,
        ...formValues,
      },
    }

    const resp = await updateCustomerMessage({ body: updatedMessage })

    if (resp) {
      setMessages(resp.messages)
    }
  }

  return (
    <Spin spinning={updateCustomerMessageLoading}>
      <Flex justify="flex-end">
        <Switch checkedChildren="Edit" unCheckedChildren="View" checked={!isViewMode} onChange={toggleMode} />
      </Flex>

      <CustomerJourneyConfigWrapper isViewMode={isViewMode}>
        <CustomerJourneyConfig
          message={message}
          values={defaultValues}
          onSubmit={handleSubmit}
          isViewMode={isViewMode}
        />
      </CustomerJourneyConfigWrapper>
    </Spin>
  )
}

export default CustomerJourneyConfigSection

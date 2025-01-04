import { ArrowLeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Flex, Typography } from 'antd-next'
import { useList } from 'react-use'
import { useLazyCallMavis } from 'util/useCallMavis'
import { State } from 'xstate'

import InviteUsersForm from './InviteUsersForm'
import { InvitedUser, OnboardingMachineContext, OnboardingMachineEvent } from './machine'

interface Props {
  state: State<OnboardingMachineContext, OnboardingMachineEvent, any, any, any>
  send: any
}

function CardFooter({ onContinue, onCancel }: { onContinue: () => void; onCancel: () => void }) {
  return (
    <Flex style={{ padding: 12, paddingLeft: 24, paddingRight: 24 }} gap={16}>
      <Button style={{ width: '50%' }} size="large" onClick={onCancel}>
        Back
      </Button>
      <Button
        type="primary"
        style={{ width: '50%', background: '#6331B3', color: 'white' }}
        size="large"
        onClick={onContinue}
      >
        Continue
      </Button>
    </Flex>
  )
}

export default function ManagerUsersCard({ state, send }: Props) {
  const [users, { push }] = useList<InvitedUser>(state.context.invitedUsers)

  const { notification } = App.useApp()
  const [createUser, { error: createUserError }] = useLazyCallMavis({
    method: 'POST',
    path: '/admin/v1/user/new',
    hideErrorNotification: true,
  })

  const addUser = async (data: InvitedUser) => {
    try {
      await createUser({ body: data })
      push(data as InvitedUser)
    } catch (e) {
      notification.error({ message: 'Error adding user', description: createUserError?.message })
    }
  }

  const onContinue = () => {
    send({ type: 'SUBMIT_INVITED_USERS', info: users })
  }

  const goBack = () => {
    send({ type: 'BACK', info: users })
  }

  return (
    <Card
      title={
        <Flex align="center" gap={16} onClick={goBack} style={{ cursor: 'pointer' }}>
          <ArrowLeftOutlined style={{ color: '#9B9A9E' }} />
          <Typography.Title level={3} style={{ margin: 0 }}>
            Manage users
          </Typography.Title>
        </Flex>
      }
      style={{ width: 500, borderRadius: 16, overflow: 'hidden' }}
      actions={[<CardFooter key="footer" onCancel={goBack} onContinue={onContinue} />]}
    >
      <InviteUsersForm values={users} onUserAdded={addUser} />
    </Card>
  )
}

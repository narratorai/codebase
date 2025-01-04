import { MailOutlined } from '@ant-design/icons'
import { App, Button, Tooltip } from 'antd-next'
import { useEffect } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'

interface Props {
  email: string
}

const ResendInvitationButton = ({ email }: Props) => {
  const { notification } = App.useApp()

  // Resend invitation to user
  const [resendInvitation, { loading: resendInvitationLoading, response: resendInvitationResponse }] =
    useLazyCallMavis<any>({
      retryable: true,
      method: 'POST',
      path: '/admin/v1/user/resend_invitation',
    })

  const handleResendInvition = () => {
    resendInvitation({
      body: {
        email,
      },
    })
  }

  // handle success notification
  useEffect(() => {
    if (resendInvitationResponse) {
      notification.success({
        key: 'resend-invitation-success',
        placement: 'topRight',
        message: (
          <span>
            Resent invitation to <span style={{ fontWeight: 'bold' }}>{email}</span>
          </span>
        ),
      })
    }
  }, [resendInvitationResponse, notification, email])

  return (
    <Tooltip title="Resend invitation" placement="topLeft">
      <Button
        loading={resendInvitationLoading}
        icon={<MailOutlined />}
        type="text"
        size="small"
        onClick={handleResendInvition}
      />
    </Tooltip>
  )
}

export default ResendInvitationButton

import { UserOutlined } from '@ant-design/icons'
import { Avatar, Card, Divider, List, Typography } from 'antd-next'

import InviteUserForm, { IFormData } from './InviteUserForm'

interface Props {
  values: IFormData[]
  onUserAdded: (data: IFormData) => void
}

export default function InviteUsersForm({ values, onUserAdded }: Props) {
  const inviteUser = async (data: IFormData) => {
    return onUserAdded(data)
  }

  return (
    <div>
      <Typography.Paragraph style={{ margin: 0, fontStyle: 'bold' }}>Add users</Typography.Paragraph>
      <Typography.Paragraph type="secondary">
        <a
          href="https://docs.narrator.ai/docs/invite-users#permissions-by-user-role"
          rel="noopener noreferrer"
          target="_blank"
        >
          See here
        </a>{' '}
        for more information about permissions
      </Typography.Paragraph>
      <InviteUserForm onSubmit={inviteUser} />
      <Divider />
      <List
        itemLayout="horizontal"
        split={false}
        dataSource={values}
        locale={{ emptyText: <p style={{ height: '180px' }} /> }}
        style={{ overflow: 'auto', maxHeight: 300 }}
        renderItem={(item) => (
          <List.Item>
            <Card style={{ width: '100%' }} size="small">
              <List.Item.Meta
                avatar={<Avatar size={52} icon={<UserOutlined />} />}
                title={item.name || item.email}
                description={item.name ? item.email : null}
              />
            </Card>
          </List.Item>
        )}
      />
    </div>
  )
}

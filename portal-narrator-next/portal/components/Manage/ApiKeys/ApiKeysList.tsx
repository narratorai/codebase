import { DeleteOutlined } from '@ant-design/icons'
import { Alert, Button, Popconfirm, Space, Spin, Table, Tooltip } from 'antd-next'
import { ICompany } from 'graph/generated'
import moment from 'moment'
import { useEffect } from 'react'
import { useAsyncFn } from 'react-use'
import { GetToken } from 'util/interfaces'
import { mavisRequest } from 'util/mavis-api'

import { useAuth0 } from '../../context/auth/hooks'
import { useCompany } from '../../context/company/hooks'
import IApiKey from './IApiKey'
import NewApiKeyButton from './NewApiKeyButton'
import { IFormData } from './NewApiKeyForm'

export function getApiKeys(getToken: GetToken, company: ICompany) {
  return mavisRequest<IApiKey[]>({
    path: '/v1/api_keys',
    getToken,
    params: {
      company: company.slug,
    },
    company,
  })
}

export function createApiKey(getToken: GetToken, company: ICompany, data: IFormData) {
  return mavisRequest<IApiKey & { api_key: string }>({
    path: '/v1/api_keys',
    method: 'POST',
    getToken,
    params: {
      company: company.slug,
    },
    company,
    body: JSON.stringify(data),
  })
}

export function deleteKey(getToken: GetToken, company: ICompany, id: string) {
  return mavisRequest({
    path: `/v1/api_keys/${id}`,
    method: 'DELETE',
    getToken,
    params: {
      company: company.slug,
    },
    company,
    textResponse: true,
  })
}

export default function ApiKeysList() {
  const { getTokenSilently: getToken } = useAuth0()
  const company = useCompany()
  const [state, fetchList] = useAsyncFn(() => getApiKeys(getToken, company), [company])
  const { loading, error, value } = state

  const createKey = async (data: IFormData) => {
    const response = await createApiKey(getToken, company, data)
    // TODO: Append response to the current state of the list.
    fetchList()

    return response
  }

  const revokeKey = async (id: string) => {
    await deleteKey(getToken, company, id)
    // TODO: Remove key from the current state of the list.
    fetchList()
  }

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      <div style={{ textAlign: 'right' }}>
        <NewApiKeyButton onCreate={createKey} />
      </div>

      {error ? <Alert type="error" message={error.message} /> : null}
      {loading ? (
        <Spin />
      ) : (
        <Table
          dataSource={value}
          columns={[
            { title: 'Label', dataIndex: 'label', key: 'label' },
            { title: 'User', dataIndex: 'user', key: 'user', render: (user) => user.email },
            {
              title: 'Created At',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (date) => moment.utc(date).tz(company.timezone).format('YYYY-MM-DD HH:mm:ss'),
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Popconfirm
                  title="Revoke key"
                  description="Are you sure to revoke this key?"
                  okText="Yes"
                  onConfirm={() => revokeKey(record.id)}
                >
                  <Tooltip title="Revoke key">
                    <Button icon={<DeleteOutlined />} size="small" type="text" />
                  </Tooltip>
                </Popconfirm>
              ),
            },
          ]}
        />
      )}
    </Space>
  )
}

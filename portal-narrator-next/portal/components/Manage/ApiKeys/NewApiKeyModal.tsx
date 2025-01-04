import { App } from 'antd-next'
import { useState } from 'react'

import CopyApiKey from './CopyApiKey'
import NewApiKeyForm, { IFormData } from './NewApiKeyForm'

interface Props {
  onCreate: (data: IFormData) => Promise<{ api_key: string }>
}

export default function NewApiKeyModal({ onCreate }: Props) {
  const [userKey, setUserKey] = useState<{ api_key: string } | null>(null)
  const { notification } = App.useApp()

  const handleCreate = async (data: IFormData) => {
    try {
      const response = await onCreate(data)
      setUserKey(response)
    } catch (error: unknown) {
      if (error instanceof Error) {
        notification.error({
          placement: 'topRight',
          message: 'Error creating API key',
          description: error.message,
        })
      }
    }
  }

  if (userKey) return <CopyApiKey apiKey={userKey.api_key} />
  return <NewApiKeyForm onSubmit={handleCreate} />
}

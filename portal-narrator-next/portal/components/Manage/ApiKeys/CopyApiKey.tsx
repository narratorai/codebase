import { Alert, Button, Input, Space } from 'antd-next'
import CopyToClipboard from 'components/shared/CopyToClipboard'
import { useState } from 'react'

interface Props {
  apiKey: string
}

export default function CopyApiKey({ apiKey }: Props) {
  const [copied, setCopied] = useState(false)

  return (
    <Space direction="vertical" size="large" style={{ display: 'flex' }}>
      <Alert
        message={
          <header>
            <strong>API key created</strong>
            <div>Make sure to copy your API key. It will never be displayed again.</div>
          </header>
        }
        type="success"
      />
      <Space.Compact style={{ display: 'flex' }}>
        <Input value={apiKey} onChange={(e) => e.preventDefault()} />
        <CopyToClipboard text={apiKey} onCopy={() => setCopied(true)}>
          <Button type="primary">{copied ? 'Copied' : 'Copy'}</Button>
        </CopyToClipboard>
      </Space.Compact>
    </Space>
  )
}

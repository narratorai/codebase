import { CopyOutlined } from '@ant-design/icons'
import { Alert, App, Input } from 'antd-next'
import CopyToClipboard from 'components/shared/CopyToClipboard'
import { FunctionNoArgs } from 'components/shared/SqlEditor'

// TODO: Copy the link to the clipboard automatically and (possibly) remove this component
const CopyLinkAlert = ({ link, onClose }: { link: string; onClose: FunctionNoArgs }) => {
  const { notification } = App.useApp()

  return (
    <Alert
      message="Copy the link below to share this SQL"
      description={
        <Input
          size="large"
          value={link}
          style={{ width: '320px', marginTop: '16px' }}
          onClick={(event) => {
            event.currentTarget.select()
            event.currentTarget.readOnly = true
          }}
          addonAfter={
            <CopyToClipboard
              text={link}
              onCopy={() => {
                notification.success({
                  message: 'Link copied to clipboard',
                  placement: 'topRight',
                  duration: 2,
                })
              }}
            >
              <CopyOutlined />
            </CopyToClipboard>
          }
        />
      }
      closable
      onClose={onClose}
    />
  )
}

export default CopyLinkAlert

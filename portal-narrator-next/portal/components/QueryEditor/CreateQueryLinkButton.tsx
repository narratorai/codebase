import { ShareAltOutlined, SyncOutlined } from '@ant-design/icons'
import { App, Button, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { useUser } from 'components/context/user/hooks'
import { IInsertSharedSqlQueryMutation, useInsertSharedSqlQueryMutation } from 'graph/generated'
import analytics from 'util/analytics'

function useSharedSqlQuery({ onCreated, notification }: { onCreated: (value: string) => void; notification: any }) {
  const company = useCompany()

  const trackAndNotify = async (data: IInsertSharedSqlQueryMutation) => {
    const createdQueryId = data?.insert_company_sql_queries?.returning[0]?.id
    const createdQueryIdLink = `${window.location.origin}/${company.slug}/query_editor?query_id=${createdQueryId}&view=1`

    analytics.track('created_shareable_query', {
      query_id: createdQueryId,
    })

    onCreated(createdQueryIdLink)
  }

  const showError = () => {
    notification.error({
      key: 'copy_to_clipboard_sql_link_error',
      message: 'Copy to Clipboard Error',
      placement: 'topRight',
    })
  }

  const [createQuery, { loading }] = useInsertSharedSqlQueryMutation({
    onCompleted: trackAndNotify,
    onError: showError,
  })

  return { createQuery, loading }
}

interface Props {
  valueRef: React.MutableRefObject<any>
  onCreated: (value: string) => void
}

const CreateQueryLinkButton = ({ valueRef, onCreated }: Props) => {
  const { notification } = App.useApp()
  const company = useCompany()
  const { user } = useUser()
  const { createQuery: createLinkQuery, loading: createLinkQueryLoading } = useSharedSqlQuery({
    onCreated,
    notification,
  })

  const createShareLink = async () => {
    if (valueRef?.current) {
      const value = valueRef?.current()
      if (value && company?.id && user?.id) {
        createLinkQuery({
          variables: { user_id: user?.id, company_id: company?.id, sql: value, related_to: 'company' },
        })
      }
    }
  }

  return (
    <Tooltip title="Create a shareable link">
      <Button size="small" type="dashed" shape="circle" onClick={createShareLink}>
        {createLinkQueryLoading ? <SyncOutlined spin /> : <ShareAltOutlined />}
      </Button>
    </Tooltip>
  )
}

export default CreateQueryLinkButton

import { Spin } from 'antd-next'
import GenericBlock from 'components/shared/Blocks/GenericBlock'
import { Typography } from 'components/shared/jawns'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'
import useNavigate from 'util/useNavigate'

interface Props {
  tableId?: string
  tableName?: string
}

const EditDimBlock = ({ tableId, tableName }: Props) => {
  const navigate = useNavigate()

  const [getDimTableBlock, { response, loading, error }] = useLazyCallMavis<any>({
    method: 'GET',
    path: `/v1/activities/dim/${tableId}`,
    retryable: true,
  })

  const block_slug = response?.block_slug
  const data = response?.data

  // get block context on load
  useEffect(() => {
    if (!loading && !error && !!tableId && isEmpty(response)) {
      getDimTableBlock({})
    }
  }, [loading, error, tableId, getDimTableBlock, response])

  return (
    <Spin spinning={loading}>
      <Typography type="title300">{`Edit Dimension: ${tableName}`}</Typography>
      <GenericBlock
        bg="transparent"
        padded={false}
        slug={block_slug}
        initialFormData={data}
        onNavigateRequest={navigate}
      />
    </Spin>
  )
}

export default EditDimBlock

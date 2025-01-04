import { Spin } from 'antd-next'
import GenericBlock from 'components/shared/Blocks/GenericBlock'
import { isEmpty } from 'lodash'
import { useEffect } from 'react'
import { useLazyCallMavis } from 'util/useCallMavis'
import useNavigate from 'util/useNavigate'

interface Props {
  streamId?: string
}

const ActivityBlock = ({ streamId }: Props) => {
  const navigate = useNavigate()

  const [getStreamBlock, { response, loading, error }] = useLazyCallMavis<any>({
    method: 'GET',
    path: `/v1/activities/stream/${streamId}`,
    retryable: true,
  })

  const block_slug = response?.block_slug
  const data = response?.data

  // get the block context when drawer is rendered
  // or if the stream id changes
  useEffect(() => {
    if (streamId && isEmpty(response) && !loading && !error) {
      getStreamBlock({})
    }
  }, [getStreamBlock, loading, error, response, streamId])

  return (
    <Spin spinning={loading}>
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

export default ActivityBlock

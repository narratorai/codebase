import { Spin } from 'antd-next'
import MarkdownRenderer from 'components/shared/MarkdownRenderer'
import { MavisDocumentationResponse } from 'util/mavis_documentation/interfaces'
import useCallMavis from 'util/useCallMavis'

interface InlineDocsProps {
  warehouseType: string
}

const InlineDocs = ({ warehouseType }: InlineDocsProps) => {
  const { response: markdownResponse, loading } = useCallMavis<MavisDocumentationResponse>({
    method: 'GET',
    path: '/v1/docs',
    params: { slugs: `warehouses/${warehouseType}` },
  })

  const markdown = markdownResponse?.all_documents?.[0]?.markdown

  return (
    <Spin spinning={loading}>
      <div data-public>
        <MarkdownRenderer source={markdown} />
      </div>
    </Spin>
  )
}

export default InlineDocs

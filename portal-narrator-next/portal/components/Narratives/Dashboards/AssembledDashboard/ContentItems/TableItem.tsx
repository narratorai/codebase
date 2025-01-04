import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import NarrativeDataTable from 'components/Narratives/Narrative/ContentWidget/NarrativeDataTable'
import queryString from 'query-string'
import { useContext } from 'react'
import { TableContent } from 'util/blocks/interfaces'

interface Props {
  content: TableContent
}

const TableItem = ({ content }: Props) => {
  const { analysisData, narrative } = useContext(AnalysisContext)
  const { value } = content

  const metadataUrl = value?.metadata?.url
  const parsedUrl = metadataUrl ? queryString.parseUrl(metadataUrl) : undefined
  const parsedQueryParams = parsedUrl?.query || {}

  // add upload_key and narrative_slug to query params if available
  const upload_key = analysisData?.upload_key
  const narrative_slug = narrative?.slug
  const shouldUseFromNarrativeParams = !!upload_key && !!narrative_slug

  const updatedQueryParams = shouldUseFromNarrativeParams
    ? { ...parsedQueryParams, upload_key, narrative_slug }
    : parsedQueryParams

  const updatedUrl = metadataUrl ? `${parsedUrl?.url}?${queryString.stringify(updatedQueryParams)}` : undefined

  const valueWithMeta = {
    ...value,
    metadata: {
      ...value.metadata,
      url: updatedUrl,
    },
  }

  return (
    <div style={{ height: '100%', width: '100%', overflowY: 'hidden' }} data-test="table-content-table-preview">
      <NarrativeDataTable content={{ ...valueWithMeta }} columnOrder={content?.column_order} isDashboard />
    </div>
  )
}

export default TableItem

import AnalysisContext from 'components/Narratives/Narrative/AnalysisContext'
import { useContext } from 'react'
import { RawMectricContent } from 'util/blocks/interfaces'

import MetricGraphic from '../../../Narrative/ContentWidget/MetricGraphic'
import OverflowModalContainer from './OverflowModalContainer'

interface Props {
  content: RawMectricContent & { id: string }
}

const MetricItem = ({ content }: Props) => {
  const { analysisData, narrative } = useContext(AnalysisContext)
  const { value } = content
  const valueWithMeta = {
    ...value,
    upload_key: analysisData?.upload_key,
    narrative_slug: narrative?.slug,
  }

  return (
    <OverflowModalContainer contentId={content.id} type="metric">
      <MetricGraphic {...valueWithMeta} fullWidth />
    </OverflowModalContainer>
  )
}

export default MetricItem

import InsightSummary from 'components/Narratives/shared/InsightSummary'
import QuestionAndGoalWidget from 'components/Narratives/shared/QuestionAndGoalWidget'
import { Box } from 'components/shared/jawns'
import { useContext } from 'react'
import styled from 'styled-components'
import { colors } from 'util/constants'
import { INarrativeConfig } from 'util/narratives/interfaces'

import AnalysisContent from '../Narrative/AnalysisContent'
import TemplateContext from './TemplateContext'

const StyledNarrativePreview = styled(Box)`
  .wrapper {
    position: relative;
    padding: 40px;
    border: 2px solid ${colors.gray200};
    border-top: 0;
    background-color: white;
  }
`

const TemplatePreview = () => {
  const { machineCurrent } = useContext(TemplateContext)
  const selectedTemplate = machineCurrent.context.graph_narrative_template

  const previewNarrativeConfig = selectedTemplate?.preview_narrative_json
    ? JSON.parse(selectedTemplate?.preview_narrative_json)
    : undefined

  const narrative = previewNarrativeConfig?.narrative as INarrativeConfig
  const { question, goal, key_takeaways, recommendation, sections, is_actionable } = narrative || {}

  return (
    <StyledNarrativePreview maxWidth={1200} mx="auto">
      <div className="wrapper">
        <QuestionAndGoalWidget question={question} goal={goal} />
        <InsightSummary keyTakeaways={key_takeaways} recommendation={recommendation} isActionable={is_actionable} />
        {(sections || []).map((section: any, index: number) => (
          <AnalysisContent key={`${section?.title}.${index}.`} index={index} {...section} />
        ))}
      </div>
    </StyledNarrativePreview>
  )
}

export default TemplatePreview

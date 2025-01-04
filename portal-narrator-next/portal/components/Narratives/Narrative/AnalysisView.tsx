import { INarrativeFile } from 'components/Narratives/interfaces'
import LastUpdatedAt from 'components/Narratives/LastUpdatedAt'
import { PrintOnly, Typography } from 'components/shared/jawns'
import { INarrative } from 'graph/generated'
import { forEach, get, isEmpty, map } from 'lodash'
import { useContext, useEffect } from 'react'
import usePrevious from 'util/usePrevious'

import InsightSummary from '../shared/InsightSummary'
import QuestionAndGoalWidget from '../shared/QuestionAndGoalWidget'
import AnalysisContent from './AnalysisContent'
import AnalysisContext from './AnalysisContext'

interface Props {
  narrative?: INarrative
  selectedFile?: INarrativeFile
  analysisData: any
}

const AnalysisView = ({ selectedFile, analysisData, narrative }: Props) => {
  const {
    narrative: { goal, sections, key_takeaways, recommendation, question, is_actionable },
  } = analysisData
  const prevSections = usePrevious(sections)

  const { setPlotsLoaded } = useContext(AnalysisContext)

  // to ensure plots have been loaded for printing
  // keep track of the plots that need to load
  // (quick print/force plots to load logic is handled in AssembledNarrativeTopBar)
  useEffect(() => {
    // once there are sections, initialize the plots loaded state
    if (isEmpty(prevSections) && !isEmpty(sections)) {
      const allPlotsLoaded: boolean[] = []
      forEach(sections, (section) => {
        // go through each content and check if it is a plot
        forEach(section.content, (content) => {
          if (content.type === 'block_plot') {
            // intitialize this plot as not loaded
            allPlotsLoaded.push(false)
          }
        })
      })

      setPlotsLoaded(allPlotsLoaded)
    }
  }, [prevSections, sections])

  return (
    <>
      <PrintOnly>
        <Typography type="title100" mb={2} data-test="assembled-narrative-name">
          {narrative?.name}
        </Typography>
        <LastUpdatedAt narrative={narrative} selectedFile={selectedFile} />
      </PrintOnly>

      <QuestionAndGoalWidget question={question} goal={goal} />

      <InsightSummary keyTakeaways={key_takeaways} recommendation={recommendation} isActionable={is_actionable} />

      {map(sections, (section, index) => (
        <AnalysisContent key={`${section.title}.${get(section, 'takeaway.title')}`} index={index} {...section} />
      ))}

      <InsightSummary />
    </>
  )
}

export default AnalysisView

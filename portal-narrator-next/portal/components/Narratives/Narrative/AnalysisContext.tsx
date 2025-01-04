import { GetFileAPIReturn, INarrativeFile } from 'components/Narratives/interfaces'
import { INarrative } from 'graph/generated'
import React from 'react'

interface IAnalysisContext {
  analysisData?: GetFileAPIReturn
  // we use different padding / hide different content
  // if there is no top info (goals, questions, recommendations, takeaways...)
  noQuestionsGoalsRecsTakeaways: boolean
  narrative?: INarrative
  datasetFiles: any
  selectedDynamicFields: { [key: string]: string }
  fileCreatedAt?: string
  timezone: string
  forceRenderPlots: boolean
  setForceRenderPlots: React.Dispatch<React.SetStateAction<boolean>>
  plotsLoaded: boolean[]
  setPlotsLoaded: React.Dispatch<React.SetStateAction<boolean[]>>
  selectedSectionIndex?: number
  setSelectedSectionIndex?: React.Dispatch<React.SetStateAction<number | undefined>>
  fileOptions: { label: string; value: string }[]
  files: INarrativeFile[]
  selectedFile?: INarrativeFile
  onSelectSnapshot: (val: string, files: INarrativeFile[]) => void
  toggleShowDateRange: () => void
  showDateRangeModal: boolean
}

const AnalysisContext = React.createContext<IAnalysisContext>({} as IAnalysisContext)

export default AnalysisContext

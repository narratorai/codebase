import { IBasicCompletionDefinition } from '@narratorai/the-sequel'
import { DatasetsFromQuery } from 'components/Datasets/interfaces'
import { IAssembleFieldsCallbackProps } from 'components/Narratives/hooks/useAssembleFields'
import { IContent } from 'components/Narratives/interfaces'
import { INarrative } from 'graph/generated'
import React, { useContext } from 'react'
import { IBlockOptions } from 'util/blocks/interfaces'
import { BlockType, IAssembledFieldsResponse } from 'util/narratives/interfaces'

interface BuildNarrativeProviderProps {
  doAssembleFields: (props: IAssembleFieldsCallbackProps) => void
  assembledFieldsResponse?: IAssembledFieldsResponse
  assembling: boolean
  saving: boolean
  submitting: boolean
  loadingFields: boolean
  updatedFields?: string[]
  loadingConfig: boolean
  autocomplete?: IBasicCompletionDefinition[]
  blockOptions?: IBlockOptions
  contentSelectOptions?: {
    label: string
    value: BlockType
    advanced: boolean
  }[]
  copiedSection?: any
  setCopiedSection: React.Dispatch<any>
  fieldConfigOverlayVisible?: boolean
  setFieldConfigOverlayVisible: React.Dispatch<any>
  handleToggleQuestionGoalKeyTakeaways: () => void
  handleToggleDashboardContentOpen: (content?: Partial<IContent>) => void
  availableDatasets?: DatasetsFromQuery
  availableDatasetsLoading?: boolean
  refetchDatasets: () => void
  refetchNarrative: () => void
  compileErrors?: { [key: string]: string }
  handleSetCompileErrors: ({ fieldName, error }: { fieldName: string; error?: string | null }) => void
  narrative?: Partial<INarrative>
  isNew: boolean
  // setContentPasted/contentPasted is used to animate the pasted content
  setContentPasted: (content?: IContent) => void
  contentPasted?: IContent
  onContentPasted: () => void // cleanup function (reset to undefined)
}

const defaultBuildNarrativeProviderProps: BuildNarrativeProviderProps = {
  doAssembleFields: () => {
    // no-op
  },
  setCopiedSection: () => {
    // no-op
  },
  setFieldConfigOverlayVisible: () => {
    // no-op
  },
  handleToggleQuestionGoalKeyTakeaways: () => {
    // no-op
  },
  refetchDatasets: () => {
    // no-op
  },
  refetchNarrative: () => {
    // no-op
  },
  handleSetCompileErrors: () => {
    // no-op
  },
  handleToggleDashboardContentOpen: async () => {
    // no-op
  },
  setContentPasted: () => {
    // no-op
  },
  onContentPasted: () => {
    // no-op
  },
  assembling: false,
  saving: false,
  submitting: false,
  loadingFields: false,
  loadingConfig: false,
  isNew: false,
}

export const BuildNarrativeContext = React.createContext<BuildNarrativeProviderProps>(
  defaultBuildNarrativeProviderProps
)
export const useBuildNarrativeContext = () => useContext(BuildNarrativeContext)

interface Props {
  value: BuildNarrativeProviderProps
  children: React.ReactNode
}

const BuildNarrativeProvider = ({ value, children }: Props) => {
  return <BuildNarrativeContext.Provider value={value}>{children}</BuildNarrativeContext.Provider>
}

export default BuildNarrativeProvider

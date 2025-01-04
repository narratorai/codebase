import { IBasicCompletionDefinition } from '@narratorai/the-sequel'
import { DatasetsFromQuery } from 'components/Datasets/interfaces'
import { IAssembleFieldsCallbackProps } from 'components/Narratives/hooks/useAssembleFields'
import React, { useContext } from 'react'
import { IBlockOptions } from 'util/blocks/interfaces'
import { BlockType, IAssembledFieldsResponse } from 'util/narratives/interfaces'

interface BuildNarrativeProviderProps {
  doAssembleFields: (props: IAssembleFieldsCallbackProps) => void
  assembledFieldsResponse?: IAssembledFieldsResponse
  updatedFields?: string[]
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
  availableDatasets?: DatasetsFromQuery
  availableDatasetsLoading?: boolean
  refetchDatasets: () => void
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
}

export const BuildNarrativeContext = React.createContext<BuildNarrativeProviderProps>(
  defaultBuildNarrativeProviderProps
)
export const useBuildNarrativeContext = (): BuildNarrativeProviderProps => useContext(BuildNarrativeContext)

interface Props {
  value: BuildNarrativeProviderProps
  children: React.ReactNode
}

const BuildNarrativeProvider = ({ value, children }: Props) => {
  return <BuildNarrativeContext.Provider value={value}>{children}</BuildNarrativeContext.Provider>
}

export default BuildNarrativeProvider

import { IStatus_Enum } from 'graph/generated'

export const NARRATIVE_HEADER_HEIGHT = 64
export const NARRATIVE_HEADER_Z_INDEX = 2
export const NARRATIVE_CONTENT_Z_INDEX = 1

export const NARRATIVE_STATUS_LABELS = {
  [IStatus_Enum.Live]: 'Shared',
  [IStatus_Enum.InProgress]: 'Private',
  [IStatus_Enum.InternalOnly]: 'Internal Only',
  [IStatus_Enum.Archived]: 'Archived',
}

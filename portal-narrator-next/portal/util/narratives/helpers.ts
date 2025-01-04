import { DragStoppedEvent } from '@ag-grid-community/core'
import { GetFileAPIReturn, INarrativeFile } from 'components/Narratives/interfaces'
import { IStatus_Enum } from 'graph/generated'
import {
  compact,
  each,
  filter,
  find,
  flatten,
  get,
  includes,
  isArray,
  isEmpty,
  isEqual,
  isString,
  last,
  map,
  startCase,
  take,
  uniqWith,
} from 'lodash'
import moment from 'moment-timezone'
import { GenericBlockOption, INarrativeTableColumn } from 'util/blocks/interfaces'
import { formatTimeStampUtc } from 'util/helpers'
import { ITableColumnOrder } from 'util/narratives/interfaces'

import { getLogger } from '@/util/logger'

import {
  CONTENT_TYPE_CUSTOM_PLOT,
  CONTENT_TYPE_DATASET_METRIC,
  CONTENT_TYPE_MARKDOWN,
  CONTENT_TYPE_MEDIA_UPLOAD,
  CONTENT_TYPE_METRIC_V2,
  CONTENT_TYPE_PLOT_V2,
  CONTENT_TYPE_TABLE_V2,
  NARRATIVE_STATE_LABELS,
} from './constants'
import { BlockType, NarrativeFields } from './interfaces'
const logger = getLogger()

// The possible "config" keys that our content sections can have.
// TODO: eventually we should consolidate all of these to be just "config"
export const POSSIBLE_CONFIG_KEYS = ['config', 'plot_options', 'plot_config', 'metric_config', 'data']

export const getDatasetsFromNarrativeConfig = ({
  narrativeConfig,
}: {
  narrativeConfig: any
}): { slug: any; group_slug: any }[] => {
  const narrativeSections = get(narrativeConfig, 'narrative.sections')

  // Get all datasets from content.dataset and content.group_slug and content.plot_config
  const allDatasets = flatten(
    map(narrativeSections, (section) => {
      return compact(
        map(section.content, (contentWidget) => {
          if (contentWidget.type === CONTENT_TYPE_CUSTOM_PLOT) {
            const datasetSlug = get(contentWidget, 'plot_config.dataset_slug')

            if (datasetSlug) {
              return {
                slug: datasetSlug,
                group_slug: get(contentWidget, 'plot_config.group_slug'),
              }
            }
          }

          // Check if it comes from a dataset_metric
          if (contentWidget.type === CONTENT_TYPE_DATASET_METRIC) {
            const datasetSlug = get(contentWidget, 'metric_config.dataset_slug')
            const groupSlug = get(contentWidget, 'metric_config.group_slug')
            return {
              slug: datasetSlug,
              group_slug: groupSlug,
            }
          }

          if (!contentWidget.dataset) {
            return null
          }

          return {
            slug: contentWidget.dataset,
            group_slug: contentWidget.group_slug,
          }
        })
      )
    })
  )

  return uniqWith(allDatasets, isEqual)
}

// Because of JSON fields, we need to convert the stringified JSON from the form
// back to an object before uploading the Narrative JSON config to S3
export const parseFormValues = ({ narrativeConfig }: { narrativeConfig: any | null }): GetFileAPIReturn | null => {
  if (!narrativeConfig) {
    return null
  }

  const { narrative, field_configs, ...rest } = narrativeConfig

  // Iterate through all the sections and the content blocks under
  // those sections and find "config" blocks that we need to JSON.parse
  const updatedSections = map(narrative.sections, (section) => {
    const updatedContent = map(section.content, (contentWidget) => {
      const widgetKeys = Object.keys(contentWidget)
      const configKey = POSSIBLE_CONFIG_KEYS.find((k) => widgetKeys.includes(k))

      return configKey
        ? {
            ...contentWidget,
            [`${configKey}`]: isString(contentWidget[configKey])
              ? JSON.parse(contentWidget[configKey])
              : contentWidget[configKey],
          }
        : contentWidget
    })

    return {
      ...section,
      content: updatedContent,
    }
  })

  // NOTE Ahmed liked field_configs at the top of the file
  return {
    field_configs: isArray(field_configs) ? field_configs : JSON.parse(field_configs || '[]'),
    narrative: {
      ...narrative,
      sections: updatedSections,
    },
    ...rest,
  }
}

interface MakeBuildNarrativeConfigProps {
  formValue: any
  fields?: NarrativeFields
}
export const makeBuildNarrativeConfig = ({ formValue, fields }: MakeBuildNarrativeConfigProps): GetFileAPIReturn => {
  // Convert all stringified JSON fields to actual JSON objects:
  const jsonifiedFormValue = parseFormValues({ narrativeConfig: formValue })

  // Calculate all datasets that are used inside the Narrative Config
  const datasets = getDatasetsFromNarrativeConfig({
    narrativeConfig: jsonifiedFormValue,
  })

  // Assemble updated Narrative Config:
  const updatedNarrativeConfig = {
    ...(jsonifiedFormValue || {}),
    fields,
    datasets,
  } as GetFileAPIReturn

  return updatedNarrativeConfig
}

export const FIELDS_TOKEN_REGEXP = /({[^{}]+})/gm
export const NEWLINE_REGEXP = /\n\n\n/gm

// Highlight MD for Narrative Preview
export const highlightSourceTokens = (str = ''): string => {
  let text = str || ''
  try {
    text = text.replace(FIELDS_TOKEN_REGEXP, '`$1`')
  } catch (err) {
    logger.warn({ err }, 'Unable to highlight source tokens')
  }

  return text
}

// wrapper to handle json.parse errors
export const getJsonInputValue = (value: string): Record<string, unknown> => {
  try {
    return isString(value) ? JSON.parse(value) : value
  } catch (error) {
    // DO NOTHING
    return {}
  }
}

// lyk if "conditioned_on" of a narrative section, content, or key takeaway will be shown in its assembled version
export const assembledSectionContentIsVisible = ({ input, compiled }: { input?: string; compiled?: any }): boolean => {
  // if they haven't typed anything into the md editor, show the section/content/key takeaway
  if (isEmpty(input)) return true

  // not checking for "undefined" b/c if there is any input it will be grayed out until compiled
  // + Mavis isn't going to send undefined 4/22/20
  // Don't show the content/section if: 0, '0', null, false, 'False', 'false', or ''
  if (
    compiled === 0 ||
    compiled === '0' ||
    compiled === null ||
    compiled === false ||
    compiled === 'False' ||
    compiled === 'false' ||
    compiled === ''
  )
    return false

  // well it must be a truthy value, so show the content/section
  return true
}
const NON_GENERIC_BLOCK_OPTIONS = [
  { label: startCase(CONTENT_TYPE_MARKDOWN), value: CONTENT_TYPE_MARKDOWN as BlockType, advanced: false },
  { label: 'Metric', value: CONTENT_TYPE_METRIC_V2 as BlockType, advanced: false },
  { label: 'Plot', value: CONTENT_TYPE_PLOT_V2 as BlockType, advanced: false },
  { label: 'Table', value: CONTENT_TYPE_TABLE_V2 as BlockType, advanced: false },
  { label: 'Media', value: CONTENT_TYPE_MEDIA_UPLOAD as BlockType, advanced: false },
]

export const makeContentOptions = (
  genericBlockOptions?: GenericBlockOption[] | null
): { label: string; value: BlockType }[] => {
  const options = (genericBlockOptions || []).map((opt) => ({
    label: opt.title,
    value: opt.slug as BlockType,
  }))

  options.unshift({ label: startCase(CONTENT_TYPE_MARKDOWN), value: CONTENT_TYPE_MARKDOWN }) || []

  return options
}

export const makeContentOptionsV2 = (
  genericBlockOptions?: GenericBlockOption[] | null
): { label: string; value: BlockType; advanced: boolean }[] => {
  const options = (genericBlockOptions || []).map((opt) => ({
    label: opt.title,
    value: opt.slug as BlockType,
    advanced: !!opt.advanced,
  }))

  const allOptions = [...NON_GENERIC_BLOCK_OPTIONS, ...options]

  return allOptions
}

// we want to skip compile if:
// `prevValue` is not `undefined` and `value === prevValue` (unchanged value)
// OR if we have updated fields and value does not contain any
export const shouldSkipCompile = ({
  value = '',
  prevValue,
  updatedFields,
}: {
  value: string
  prevValue?: string
  updatedFields?: string[]
}): boolean => {
  // return `false` (don't skip compile) if
  // value contains any updated fields
  if (updatedFields) {
    return !updatedFields.some((field) => `${value}`.includes(`{${field}}`))
  }

  // if value has not changed, we can safely skip compile
  return value === prevValue
}

// Safety check on adding new state that's not in constants
interface IGetNarrativeStateLabel {
  state: IStatus_Enum
}
export const getNarrativeStateLabel = ({ state }: IGetNarrativeStateLabel) => {
  // can fall back to startcase of the value
  return (NARRATIVE_STATE_LABELS as Record<IStatus_Enum, string>)[state] || startCase(state)
}

export const makeFileName = (file: string) => {
  const segments = file.split('/')
  return last(segments)?.split('.json')[0]
}

export const makeFiles = (narrativeRuns?: { s3_key: string }[]): INarrativeFile[] => {
  if (!narrativeRuns) return []

  return map(narrativeRuns, (run) => {
    const key = run?.s3_key || ''
    const name = makeFileName(key) || ''
    return {
      key: key,
      name: name,
    }
  })
}

export const makeFileOptions = (files: INarrativeFile[], timezone: string): { label: string; value: string }[] => {
  return map(files, (file) => ({
    label: formatTimeStampUtc(file.name, timezone),
    value: file.name,
  }))
}

interface GetVisibleFileOptionsProps {
  fromTime?: string
  toTime?: string
  fileOptions: { label: string; value: string }[]
}
export const getVisibleFileOptions = ({ fromTime, toTime, fileOptions }: GetVisibleFileOptionsProps) => {
  // if no date range selected
  // return first 10
  if (!fromTime || !toTime) {
    return take(fileOptions, 10)
  }

  // if a date range is selected
  // return all file options that are within range
  if (fromTime && toTime) {
    return filter(fileOptions, (fileOp) => {
      return moment(fileOp.value).isAfter(fromTime) && moment(fileOp.value).isBefore(toTime)
    })
  }

  // default to no options
  return []
}

interface SortTableColumnsProps {
  columnOrder?: ITableColumnOrder
  columns: INarrativeTableColumn[]
}

export const sortTableColumns = ({ columnOrder, columns }: SortTableColumnsProps) => {
  if (!columnOrder) {
    return columns
  }

  const sortedColumns: INarrativeTableColumn[] = []

  // first check left pinned columns
  if (!isEmpty(columnOrder.left)) {
    each(columnOrder.left, (colId) => {
      const column = find(columns, (col) => col.name === colId)
      if (column) {
        // don't mutate the original column
        const columnToUpdate = { ...column }
        // updated pinned value
        columnToUpdate.pinned = 'left'
        // add column
        sortedColumns.push(columnToUpdate)
      }
    })
  }

  // then check non-pinned columns
  if (!isEmpty(columnOrder.order)) {
    each(columnOrder.order, (colId) => {
      const column = find(columns, (col) => col.name === colId)
      if (column) {
        // don't mutate the original column
        // (here maybe less important since just a push but keep it consistent)
        const columnToUpdate = { ...column }
        // add column
        sortedColumns.push(columnToUpdate)
      }
    })
  }

  // finally check right pinned columns
  if (!isEmpty(columnOrder.right)) {
    each(columnOrder.right, (colId) => {
      const column = find(columns, (col) => col.name === colId)
      if (column) {
        // don't mutate the original column
        const columnToUpdate = { ...column }
        // updated pinned value
        columnToUpdate.pinned = 'right'
        // add column
        sortedColumns.push(columnToUpdate)
      }
    })
  }

  return sortedColumns
}

// on ag-grid's drag stop
// get the column order (including pinned columns)
export const makeOrderedTableColumns = (event: DragStoppedEvent) => {
  // get all columns
  const allColumns = event.columnApi.getAllDisplayedColumns()

  // find the left pinned columns
  const leftPinnedColumnIds = map(
    filter(allColumns, (col) => col['pinned'] === 'left'),
    (column) => column['colId']
  )

  // find the right pinned columns
  const rightPinnedColumnIds = map(
    filter(allColumns, (col) => col['pinned'] === 'right'),
    (column) => column['colId']
  )

  const allPinnedColumnIds = [...leftPinnedColumnIds, ...rightPinnedColumnIds]
  const allColumnIds = map(allColumns, (col) => col['colId'])

  // find the non-pinned columns
  const nonPinnedColumnIds = filter(allColumnIds, (colId) => !includes(allPinnedColumnIds, colId))

  return { left: leftPinnedColumnIds, right: rightPinnedColumnIds, order: nonPinnedColumnIds }
}

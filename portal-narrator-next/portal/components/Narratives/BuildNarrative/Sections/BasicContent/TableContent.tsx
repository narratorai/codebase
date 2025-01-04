import { InfoCircleOutlined } from '@ant-design/icons'
import { Checkbox, Collapse, Input, InputNumber, Spin, Tooltip } from 'antd-next'
import { CheckboxChangeEvent } from 'antd-next/es/checkbox'
import { FormItem, SearchSelect } from 'components/antd/staged'
import DatasetSearchBar from 'components/Datasets/DatasetSearchBar'
import { useBuildNarrativeContext } from 'components/Narratives/BuildNarrative/BuildNarrativeProvider'
import AssembledContentContainer from 'components/Narratives/BuildNarrative/Sections/BasicContent/AssembledContentContainer'
import * as SharedLayout from 'components/Narratives/BuildNarrative/Sections/SharedLayout'
import { useCompileContent } from 'components/Narratives/hooks'
import NarrativeDataTable from 'components/Narratives/Narrative/ContentWidget/NarrativeDataTable'
import { Box, Flex, Typography } from 'components/shared/jawns'
import MarkdownTableRenderer from 'components/shared/MarkdownTableRender'
import { isBoolean, isEmpty, isString, map } from 'lodash'
import { MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react'
import { useField, useForm } from 'react-final-form'
import { INarrativeTableContent } from 'util/blocks/interfaces'
import { CONTENT_TYPE_TABLE_V2 } from 'util/narratives'
import { makeTableCopiedContent } from 'util/shared_content/helpers'
import { useLazyCallMavis } from 'util/useCallMavis'

import CompileRefreshCtas from './CompileRefreshCtas'
import { GroupResponse } from './interfaces'

const DATASET_SLUG_FIELDNAME = 'data.dataset_slug'
const GROUP_FIELDNAME = 'data.group_slug'
const USE_DATA_TABLE_FIELDNAME = 'data.as_data_table'
const TITLE_FIELDNAME = 'data.title'
const LIMIT_ROWS_FIELDNAME = 'data.limit'
const COLUMN_ORDER_FIELDNAME = 'column_order'

export interface CompiledResponse {
  type: string
  // comes back as string if "Use Data Table" is NOT selected
  value: INarrativeTableContent | string
}

interface Props {
  fieldName: string
  setCompileDisabled: (disabled: boolean) => void
  compileContentRef: MutableRefObject<(() => void) | undefined>
  refreshInputOptionsRef: MutableRefObject<(() => void) | undefined>
  showRecompileAndRefreshButtons?: boolean
}

const TableContent = ({
  fieldName,
  compileContentRef,
  setCompileDisabled,
  refreshInputOptionsRef,
  showRecompileAndRefreshButtons = false,
}: Props) => {
  const { batch } = useForm()

  // set this to true on first update
  const [hasSetInitialValues, setHasSetInitialValues] = useState(false)

  const {
    assembledFieldsResponse,
    availableDatasets: datasets,
    availableDatasetsLoading: datasetsLoading,
    refetchDatasets,
  } = useBuildNarrativeContext()

  const fields = assembledFieldsResponse?.fields

  const {
    input: { value: datasetSlug, onChange: onChangeSelectedDatasetSlug, meta: datasetMeta },
  } = useField(`${fieldName}.${DATASET_SLUG_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: selectedGroup, onChange: onChangeSelectedGroup, meta: groupMeta },
  } = useField(`${fieldName}.${GROUP_FIELDNAME}`, { subscription: { value: true } })

  const {
    input: { value: columnOrderValue, onChange: onChangeColumnOrder },
  } = useField(`${fieldName}.${COLUMN_ORDER_FIELDNAME}`, { subscription: { value: true } })

  // get all Dataset's Groups
  const [getGroups, { response: groups, loading: groupsLoading }] = useLazyCallMavis<GroupResponse[]>({
    method: 'GET',
    path: `/v1/narrative/content/get_dataset_groups`,
    // pass dataset slug in callback, b/c form state
    // isn't defined here, at the time it's called below (and we need it!)
  })

  const handleOnChangeSelectedDataset = useCallback(
    (value: string) => {
      // note: value comes from DatasetSearchBar: `${slug} ${tag}`
      const datasetSlug = value?.split(' ')[0] || undefined

      if (datasetSlug) {
        // fetch groups for selected dataset
        getGroups({ params: { slug: datasetSlug } })
      }

      batch(() => {
        // and add dataset_slug for save narrative endpoint payload
        onChangeSelectedDatasetSlug(datasetSlug)
        // and clear selected group
        onChangeSelectedGroup(undefined)
      })
    },
    [onChangeSelectedGroup, getGroups]
  )

  // get initial group options on page load
  useEffect(() => {
    if (!hasSetInitialValues) {
      if (datasetSlug) {
        getGroups({ params: { slug: datasetSlug } })
      }

      setHasSetInitialValues(true)
    }
  }, [hasSetInitialValues, getGroups, datasetSlug])

  const groupsOptions = useMemo(() => {
    if (groups) {
      return map(groups, (g) => ({ label: g.name, value: g.slug }))
    }

    return []
  }, [groups])

  const {
    input: { value: useDataTableValue, onChange: onChangeUseDataTable, meta: useDataTableMeta },
  } = useField(`${fieldName}.${USE_DATA_TABLE_FIELDNAME}`, { subscription: { value: true } })

  const handleChangeUseDataTable = useCallback(
    (e: CheckboxChangeEvent) => {
      onChangeUseDataTable(e.target.checked)
    },
    [onChangeUseDataTable]
  )

  const { input: titleInput } = useField(`${fieldName}.${TITLE_FIELDNAME}`, { subscription: { value: true } })
  const { input: limitRowsInput } = useField(`${fieldName}.${LIMIT_ROWS_FIELDNAME}`, { subscription: { value: true } })

  // These values will be compiled and used to generate
  // right side (preview) content
  const valuesForCompile = useMemo(() => {
    // only return if it has the minimum values
    // dataset, group
    if (!datasetSlug || !selectedGroup) {
      return {}
    }

    return {
      dataset_slug: datasetSlug,
      group_slug: selectedGroup,
      as_data_table: !!useDataTableValue,
      title: titleInput?.value || null,
      limit: limitRowsInput?.value || null,
      column_order: columnOrderValue,
    }
  }, [datasetSlug, selectedGroup, useDataTableValue, titleInput?.value, limitRowsInput?.value, columnOrderValue])

  const {
    loading: compiling,
    response: compiledResponse = [],
    callback: runCompile,
    error: compileError,
  } = useCompileContent({
    fieldName,
    contents: [
      {
        type: CONTENT_TYPE_TABLE_V2,
        data: valuesForCompile as any,
      },
    ],
  })

  const handleRunCompile = useCallback(() => {
    runCompile({
      contents: [
        {
          type: CONTENT_TYPE_TABLE_V2,
          data: valuesForCompile as any,
        },
      ],
      fields,
    })
  }, [valuesForCompile, fields])

  // set callback for manually triggering compile
  useEffect(() => {
    if (handleRunCompile) {
      compileContentRef.current = handleRunCompile
    }
  }, [handleRunCompile])

  // reload dataset and group options
  // (used in BasicContent in refresh button)
  const handleRefreshOptions = useCallback(() => {
    refetchDatasets()

    if (datasetSlug) {
      getGroups({ params: { slug: datasetSlug } })
    }
  }, [refetchDatasets, getGroups, datasetSlug])

  // set callback for manually refreshing input options
  // (datasets, groups, and metrics)
  useEffect(() => {
    if (handleRefreshOptions) {
      refreshInputOptionsRef.current = handleRefreshOptions
    }
  }, [handleRefreshOptions])

  useEffect(() => {
    setCompileDisabled(isEmpty(selectedGroup))
  }, [setCompileDisabled, selectedGroup])

  const compiledResponseData = (compiledResponse?.[0]?.value || {}) as CompiledResponse['value']
  const compiledResponseIsMarkdown = isString(compiledResponseData)

  const copyContentValues =
    !isEmpty(valuesForCompile) &&
    isString(valuesForCompile?.dataset_slug) &&
    isString(valuesForCompile?.group_slug) &&
    isBoolean(valuesForCompile?.as_data_table)
      ? makeTableCopiedContent({
          ...valuesForCompile,
          dataset_slug: valuesForCompile.dataset_slug,
          group_slug: valuesForCompile.group_slug,
          as_data_table: valuesForCompile.as_data_table,
        })
      : undefined

  return (
    <Flex>
      <SharedLayout.EditorBox>
        <Flex justifyContent={showRecompileAndRefreshButtons ? 'space-between' : 'flex-start'} alignItems="center">
          <Typography type="title400">Dataset Table</Typography>

          {showRecompileAndRefreshButtons && (
            <CompileRefreshCtas
              compiling={compiling}
              handleRunCompile={handleRunCompile}
              handleRefreshOptions={handleRefreshOptions}
            />
          )}
        </Flex>

        <FormItem label="Select Dataset" meta={datasetMeta} layout="vertical" compact required>
          <Spin spinning={datasetsLoading}>
            <DatasetSearchBar
              datasetsOverride={datasets || []}
              onSelectOverride={handleOnChangeSelectedDataset}
              extraSelectProps={{ value: datasetSlug, withBorder: true }}
            />
          </Spin>
        </FormItem>

        <FormItem label="Select Group" meta={groupMeta} layout="vertical" compact required>
          <Spin spinning={groupsLoading}>
            <SearchSelect
              data-test="table-content-group-select"
              value={selectedGroup}
              onChange={onChangeSelectedGroup}
              options={groupsOptions}
            />
          </Spin>
        </FormItem>

        <FormItem meta={useDataTableMeta} layout="vertical" compact required>
          <Box mt={2}>
            <Checkbox
              onChange={handleChangeUseDataTable}
              checked={useDataTableValue}
              data-test="table-content-use-data-table-checkbox"
            >
              Use Data Table
            </Checkbox>
          </Box>
        </FormItem>

        <Collapse ghost>
          <Collapse.Panel header="Title" key="rename">
            <FormItem compact>
              <Input {...titleInput} placeholder="Add a title" data-test="table-content-title-input" />
            </FormItem>
          </Collapse.Panel>
        </Collapse>

        <Collapse ghost>
          <Collapse.Panel
            header={
              <Flex>
                <Typography mr={1} data-test="limit-table-rows-text">
                  Limit Rows
                </Typography>
                <Box>
                  <Tooltip title="Limit the number of rows shown." placement="right">
                    <InfoCircleOutlined />
                  </Tooltip>
                </Box>
              </Flex>
            }
            key="rename"
          >
            <FormItem compact>
              <Flex alignItems="center">
                <Typography mr={1}>Show only</Typography>
                <InputNumber {...limitRowsInput} min={1} data-test="table-content-limit-rows-input" />
                <Typography ml={1}>rows</Typography>
              </Flex>
            </FormItem>
          </Collapse.Panel>
        </Collapse>
      </SharedLayout.EditorBox>

      <SharedLayout.PreviewBox>
        <AssembledContentContainer compiling={compiling} compileError={compileError}>
          {!isEmpty(compiledResponseData) && (
            <Flex justifyContent="space-around" alignItems="center">
              {compiledResponseIsMarkdown ? (
                // show markdown for string values (hasn't check use data table)
                <div style={{ maxWidth: '100%' }} data-test="table-content-markdown-preview">
                  <MarkdownTableRenderer source={compiledResponseData} copyContentValues={copyContentValues} />
                </div>
              ) : (
                // show table if passed columns/rows
                <div style={{ height: '400px', width: '100%' }} data-test="table-content-table-preview">
                  <NarrativeDataTable
                    content={{ ...compiledResponseData }}
                    copyContentValues={copyContentValues}
                    onUpdateColumnOrder={onChangeColumnOrder}
                    columnOrder={columnOrderValue}
                  />
                </div>
              )}
            </Flex>
          )}
        </AssembledContentContainer>
      </SharedLayout.PreviewBox>
    </Flex>
  )
}

export default TableContent

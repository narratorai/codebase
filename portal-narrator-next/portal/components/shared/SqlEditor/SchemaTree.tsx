/* eslint-disable no-case-declarations */
import { InfoCircleOutlined, SearchOutlined } from '@ant-design/icons'
import { Input, Spin, Tooltip, Tree } from 'antd-next'
import { SearchSelect } from 'components/antd/staged'
import { useCompany, useCompanyRefetch } from 'components/context/company/hooks'
import { Box, Flex, Link, Typography } from 'components/shared/jawns'
import { filter, includes, isEmpty } from 'lodash'
import { useEffect, useMemo, useRef, useState } from 'react'
import Measure from 'react-measure'
import styled from 'styled-components'
import { useDebounce } from 'use-debounce'
import usePrevious from 'util/usePrevious'

import { getLogger } from '@/util/logger'

import { highlightTree, makeTreeData } from './services/helpers'
import { ISchemas, ITreeBranch } from './services/interfaces'

const logger = getLogger()

// antd.css overrides
const TreeWrapper = styled.div`
  flex-grow: 1;
  height: 100%;

  .antd5-tree-node-selected {
    background-color: initial !important;
  }

  .highlighted-value {
    background-color: ${(props) => props.theme.colors.teal500};
    color: white;
  }
`

interface SchemaTreeProps {
  schemasData: ISchemas
}

// don't show schema select for companies w/ under 10 schemas
const MAX_SCHEMAS_FOR_SEARCH = 10

const DefaultSchemasTooltip = () => {
  return (
    <Box ml={1}>
      <Tooltip
        mouseEnterDelay={0.5}
        title={
          <Box>
            <Typography>Not seeing the schema you're looking for?</Typography>
            <Typography>
              Make sure it's added to "Default Schemas" in{' '}
              <Link to="/manage/company" target="_blank">
                company settings
              </Link>{' '}
              and refresh this page.
            </Typography>
          </Box>
        }
      >
        <InfoCircleOutlined />
      </Tooltip>
    </Box>
  )
}

// A LOT OF THIS IS INSPIRED BY: https://codesandbox.io/s/tkf8r
const SchemaTree = ({ schemasData }: SchemaTreeProps) => {
  const company = useCompany()
  const refetchCompanySeed = useCompanyRefetch()

  // make sure company is up-to-date to check for warehouse_default_schemas
  const [hasRefetchedCompany, setHasRefetchedCompany] = useState<boolean>(false)
  useEffect(() => {
    if (!hasRefetchedCompany && refetchCompanySeed) {
      refetchCompanySeed()
      setHasRefetchedCompany(true)
    }
  }, [hasRefetchedCompany, refetchCompanySeed])

  // to optimize for searching (trees get very large):
  // if default schemas are set - we will hide other schemas
  // If hasDefefaultSchemas: show tooltip letting user know they may
  // not be able to see a particular schema
  const hasDefefaultSchemas = !isEmpty(company.warehouse_default_schemas)

  const [searchReady, setSearchReady] = useState<boolean>(true)
  const prevSearchReady = usePrevious(searchReady)

  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([])
  const prevSelectedSchemas = usePrevious(selectedSchemas)

  const [searchValue, setSearchValue] = useState<string>('')
  const [debouncedSearchValue] = useDebounce(searchValue, 500)
  const prevDebouncedSearchValue = usePrevious(debouncedSearchValue)

  // tree is opened/closed by clicking or with search
  const [expandedKeys, setExpandedKeys] = useState<any[]>([])
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(false)

  const searchableTreeDataRef = useRef<ITreeBranch[]>([])

  const schemasKeys = useMemo(() => Object.keys(schemasData), [schemasData])
  const schemasOptions = useMemo(() => {
    return schemasKeys.map((schema) => ({ label: schema, value: schema }))
  }, [schemasKeys])

  const searchAllSchemas = useMemo(() => {
    return schemasKeys?.length <= MAX_SCHEMAS_FOR_SEARCH
  }, [schemasKeys])

  const handleUpdateSchemasSelect = (schemas: string[]) => {
    setSelectedSchemas(schemas)
  }

  // if there are less than MAX_SCHEMAS_FOR_SEARCH
  // search all schemas
  useEffect(() => {
    if (searchAllSchemas) {
      setSelectedSchemas(schemasKeys)
    }
  }, [searchAllSchemas, schemasKeys])

  const searchWorkerRef = useRef<Worker | null>()
  // used for worker ref to cancel previous reqs while typing
  const searchValueRef = useRef<string>('')

  // can be (non)searched tree data
  const [treeData, setTreeData] = useState<any>([])
  const initialTreeData = useMemo(() => {
    return makeTreeData(schemasData)
  }, [schemasData])

  // loading state for search
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    searchWorkerRef.current = new Worker(new URL('./services/SchemaTree.worker.ts', import.meta.url))

    const workerOnMessage = (evt: MessageEvent<any>) => {
      logger.debug(evt.data, 'Message from TS worker')

      switch (evt?.data.type) {
        case 'started':
          setSearchReady(true)
          return
        case 'searchedResults':
          const { expandedKeys: eventExpandedKeys } = evt.data.data

          // don't make tree if they are still typing
          if (evt.data.searchValue !== searchValueRef.current) {
            return
          }

          const highlightedTreeData = highlightTree({
            expandedKeys: eventExpandedKeys,
            treeData: searchableTreeDataRef.current,
            searchValue: evt.data.searchValue,
          })

          setTreeData(highlightedTreeData)
          setExpandedKeys(eventExpandedKeys)
          setAutoExpandParent(true)
          setSearching(false)
          return
      }
    }

    searchWorkerRef.current.addEventListener('message', workerOnMessage)

    return () => {
      searchWorkerRef.current?.removeEventListener('message', workerOnMessage)
      searchWorkerRef.current?.terminate()
      searchWorkerRef.current = null
    }
  }, [])

  useEffect(() => {
    // if user clears out selected schemas
    // clear expanded keys, tree data, and search input
    if (prevSelectedSchemas && prevSelectedSchemas?.length > 0 && selectedSchemas.length === 0) {
      setSearchValue('')
      setExpandedKeys([])
      setTreeData(initialTreeData)
      return
    }

    // if there are selected schemas
    // make new tree data for search
    const shouldSetFirstSchema = !prevSelectedSchemas && !isEmpty(selectedSchemas)
    const shouldSetRemainingSchemas =
      prevSelectedSchemas?.length !== selectedSchemas.length && !isEmpty(selectedSchemas)
    if (shouldSetFirstSchema || shouldSetRemainingSchemas) {
      setSearchReady(false)
      const selectedSchemasData: ISchemas = {}
      schemasKeys.forEach((key) => {
        if (selectedSchemas.includes(key)) {
          selectedSchemasData[key] = schemasData[key]
        }
      })

      const selectedTreeData = makeTreeData(selectedSchemasData)
      // set selectedTreeData in ref to use later in the workerOnMessage
      // to build highlighted tree data
      searchableTreeDataRef.current = selectedTreeData
      searchWorkerRef.current?.postMessage({ type: 'start', treeData: selectedTreeData })
    }
  }, [prevSelectedSchemas, selectedSchemas, schemasData, schemasKeys, initialTreeData])

  useEffect(() => {
    // when search becomes ready (meaning search has been initialized by changing selected schemas)
    if (!prevSearchReady && searchReady && !isEmpty(selectedSchemas)) {
      searchWorkerRef.current?.postMessage({ type: 'search', input: debouncedSearchValue })
    }
  }, [prevSearchReady, searchReady, debouncedSearchValue, selectedSchemas])

  const onExpand = (keys: any[]) => {
    setExpandedKeys(keys)
    setAutoExpandParent(false)
  }

  // Override "select" mechanism to have it act like expand:
  const onSelectTree = (keys: any[], event: any) => {
    const selectedKey = event.node?.key
    const alreadyExpanded = includes(expandedKeys, selectedKey)

    // Need this logic to know how to remove a key once it's "deselected"
    // - if the key is alreadyExpanded, remove it from the state.expandedKeys array
    // - if the key is not alreadyExpanded, add it to the state.expandedKeys array
    const updatedExpandedKeys = alreadyExpanded
      ? filter(expandedKeys, (key) => key !== selectedKey)
      : [...expandedKeys, selectedKey]

    setExpandedKeys(updatedExpandedKeys)
    setAutoExpandParent(false)
  }

  const handleSearchInputChange = (event: any) => {
    const { value } = event.target
    if (!isEmpty(value) && value.length !== 1) {
      setSearching(true)
    }

    setSearchValue(value)
  }

  // On search change
  // Update expanded values AND highlighted values
  useEffect(() => {
    searchValueRef.current = debouncedSearchValue
    // don't bother searching for one character
    if (debouncedSearchValue.length === 1) {
      return
    }

    // if the search value has changed - do the search with new input
    if (
      prevDebouncedSearchValue !== undefined &&
      prevDebouncedSearchValue !== debouncedSearchValue &&
      !isEmpty(selectedSchemas)
    ) {
      searchWorkerRef.current?.postMessage({ type: 'search', input: debouncedSearchValue })
    }
  }, [prevDebouncedSearchValue, debouncedSearchValue, selectedSchemas])

  const searchTooltipTitle = useMemo(() => {
    let title = ''

    // if there are no schemas
    if (isEmpty(schemasKeys)) {
      // this shouldn't happen, but when things go wrong...
      title = 'No tables found. Please check the warehouse account permissions.'
    }

    // if there are schemas they can select - but they haven't selected any
    if (!isEmpty(schemasKeys) && isEmpty(selectedSchemas)) {
      // (remember that we auto select all for companies less than MAX_SCHEMAS_FOR_SEARCH)
      title = 'Too many values to search. Please filter the schemas below.'
    }

    return title
  }, [selectedSchemas, schemasKeys])

  return (
    <Flex style={{ height: '100%' }} flexDirection="column">
      {/* don't show schema select for companies with less than MAX_SCHEMAS_FOR_SEARCH
         - (we search all schemas)
      */}
      <Box mb={1}>
        <Spin spinning={!searchReady}>
          <Tooltip title={searchTooltipTitle} mouseEnterDelay={0.5} mouseLeaveDelay={0}>
            <Flex alignItems="center">
              <Input
                size="large"
                value={searchValue}
                prefix={<SearchOutlined style={{ opacity: '0.5', marginRight: '4px' }} />}
                placeholder={isEmpty(selectedSchemas) ? 'Select schemas below to search' : 'Search schema.table.column'}
                onChange={handleSearchInputChange}
                disabled={isEmpty(selectedSchemas) || isEmpty(schemasKeys)}
              />

              {searchAllSchemas && hasDefefaultSchemas && <DefaultSchemasTooltip />}
            </Flex>
          </Tooltip>
        </Spin>
      </Box>

      {!searchAllSchemas && !isEmpty(schemasKeys) && (
        <Box mb={2}>
          <Typography>Limit schema to:</Typography>
          <Flex alignItems="center">
            <SearchSelect
              placeholder="Select schemas to search"
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              options={schemasOptions}
              onChange={handleUpdateSchemasSelect}
              value={selectedSchemas}
              popupMatchSelectWidth={false}
            />

            {hasDefefaultSchemas && <DefaultSchemasTooltip />}
          </Flex>
        </Box>
      )}

      <Measure bounds>
        {({ measureRef, contentRect }) => {
          const height = contentRect.bounds?.height
          return (
            <TreeWrapper ref={measureRef} data-private>
              {height ? (
                <Spin spinning={searching}>
                  <Tree
                    blockNode
                    showLine
                    height={height - 16}
                    autoExpandParent={autoExpandParent}
                    onExpand={onExpand}
                    onSelect={onSelectTree}
                    expandedKeys={expandedKeys}
                    treeData={isEmpty(treeData) ? initialTreeData : treeData}
                    style={{ margin: '8px' }}
                  />
                </Spin>
              ) : null}
            </TreeWrapper>
          )
        }}
      </Measure>
    </Flex>
  )
}

export default SchemaTree

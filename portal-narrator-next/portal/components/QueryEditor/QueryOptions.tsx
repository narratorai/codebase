import { App, Col, Row, Select } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import Fuse from 'fuse.js'
import { useListCompanySqlQueriesQuery } from 'graph/generated'
import { debounce, filter, find, isEmpty, map } from 'lodash'
import queryString from 'query-string'
import React, { useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router'
import useQueryParams from 'util/useQueryParams'

import DeleteQueryButton from './DeleteQueryButton'
import SaveQueryButton from './SaveQueryButton'

function SearchableSelect({
  value,
  options: defaultOptions,
  onChange,
  placeholder,
}: {
  value?: string | null
  options: any[]
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [options, setOptions] = useState(defaultOptions)
  const fuse = useMemo(() => new Fuse(defaultOptions, { useExtendedSearch: true, keys: ['label'] }), [defaultOptions])

  const handleSearch = debounce((value: string) => {
    if (isEmpty(value)) setOptions(defaultOptions)
    else setOptions(fuse.search(value).map((result) => result.item))
  }, 250)

  useEffect(() => {
    setOptions(defaultOptions)
  }, [defaultOptions])

  return (
    <Select
      showSearch
      value={value}
      options={options}
      style={{ width: '100%' }}
      filterOption={false}
      onSearch={handleSearch}
      onChange={onChange}
      placeholder={placeholder}
    />
  )
}

interface Props {
  sqlRef: React.MutableRefObject<Function | null>
  unblockRef: React.MutableRefObject<Function | null>
}

export default function QueryOptions({ sqlRef, unblockRef }: Props) {
  const { notification } = App.useApp()
  const company = useCompany()
  const history = useHistory()

  const [queryParams, setQueryParams] = useQueryParams()
  const { query_id } = queryParams as { query_id?: string }

  const { data: sqlQueries, refetch: refetchQueries } = useListCompanySqlQueriesQuery({
    variables: {
      company_id: company.id,
    },
    onError: (error) => {
      notification.error({
        key: 'get_queries_failure',
        message: 'There was an error fetching your queries',
        placement: 'topRight',
        description: error.message,
        duration: 0,
      })
    },
  })

  // Allow to select and delete named queries only
  // We store queries with no name as drafts
  const namedSqlQueries = filter(sqlQueries?.company_sql_queries, (qry) => !isEmpty(qry.name))
  const selectedNamedQuery = find(namedSqlQueries, ['id', query_id])
  const options = map(namedSqlQueries, (qry) => ({ label: qry.name, value: qry.id }))

  const navigateToQuery = (value: string) => setQueryParams({ query_id: value, view: 1 })

  // TODO: Move to context
  const handleIgnoreUnblock = () => {
    // Stop back listener, it will reset itself on history change
    unblockRef.current?.()
    unblockRef.current = null
  }

  const resetState = async () => {
    await refetchQueries()
    handleIgnoreUnblock() // cleanupDirtyEditorState

    // Replace the browser history to prevent users from navigating back to a URL
    // that no longer exists. This is achieved by removing the query_id from the
    // query parameters
    const nextQueryParams = { ...queryParams, query_id: undefined }
    // TODO: use setQueryParams from useQueryParams
    history.replace({
      search: `?${queryString.stringify(nextQueryParams)}`,
    })
  }

  const onSave = async () => {
    handleIgnoreUnblock()
    await refetchQueries()
  }

  return (
    <Row gutter={8} wrap={false}>
      <Col flex={1}>
        <SearchableSelect
          value={selectedNamedQuery?.name}
          options={options}
          onChange={navigateToQuery}
          placeholder="Search queries"
        />
      </Col>
      <Col>
        <SaveQueryButton query_id={query_id} sqlRef={sqlRef} selectedQuery={selectedNamedQuery} onSave={onSave} />
      </Col>
      <Col>
        <DeleteQueryButton selectedQuery={selectedNamedQuery} onDelete={resetState} />
      </Col>
    </Row>
  )
}

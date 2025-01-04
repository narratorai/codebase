import { RefSelectProps } from 'antd-next/es/select'
import { useCompany } from 'components/context/company/hooks'
import DatasetIndexContext from 'components/Datasets/DatasetIndexContext'
import { DatasetsFromQuery } from 'components/Datasets/interfaces'
import ResourceSearchSelect from 'components/shared/IndexPages/ResourceSearchSelect'
import { Box } from 'components/shared/jawns'
import { map } from 'lodash'
import { useContext, useMemo, useRef } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import { sortDatasetsByRecentlyViewed } from './helpers'

const SearchContainer = styled(Box)`
  max-width: 100%;
  width: 560px;

  @media only screen and (width <= 1100px) {
    width: 400px;
  }
`

const makeOptions = (datasets?: DatasetsFromQuery, idAsValue?: boolean) =>
  map(datasets, (dataset) => ({
    key: dataset.id,
    label: dataset.name,
    value: idAsValue ? dataset.id : dataset.slug,
    resource: dataset,
  }))

interface Props {
  datasetsOverride?: DatasetsFromQuery
  onSelectOverride?: (value: string) => void
  extraSelectProps?: {
    withBorder?: boolean
    withTallerMenu?: boolean
    value?: string
  }
}

export const createDatasetSearchOptions = (datasets?: DatasetsFromQuery, idAsValue?: boolean) => {
  return makeOptions(sortDatasetsByRecentlyViewed(datasets), idAsValue)
}

const DatasetSearchBar = ({ datasetsOverride, onSelectOverride, extraSelectProps = {} }: Props) => {
  const history = useHistory()
  const company = useCompany()
  const { datasets: datasetsFromContext } = useContext(DatasetIndexContext)
  const selectRef = useRef<RefSelectProps>(null)

  const datasets = datasetsOverride || datasetsFromContext
  const options = useMemo(() => createDatasetSearchOptions(datasets), [datasets])

  const onSelect = (datasetSlug: string) => {
    if (selectRef.current) {
      selectRef.current?.blur()
    }

    // escape early if select override is passed
    if (onSelectOverride) {
      return onSelectOverride(datasetSlug)
    }

    // otherwise default navigate to the edit dataset page
    history.push(`/${company.slug}/datasets/edit/${datasetSlug}`)
  }

  return (
    <SearchContainer data-test="dataset-search-bar">
      <ResourceSearchSelect
        onSelect={onSelect}
        options={options}
        placeholderText="Search Datasets"
        shouldGetPopupContainer
        extraSelectProps={extraSelectProps}
        // @ts-ignore
        selectRef={selectRef}
      />
    </SearchContainer>
  )
}

export default DatasetSearchBar

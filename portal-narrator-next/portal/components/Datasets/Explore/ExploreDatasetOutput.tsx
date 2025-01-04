import MetricGraphic from 'components/Narratives/Narrative/ContentWidget/MetricGraphic'
import DataTable from 'components/shared/DataTable/DataTable'
import DynamicPlot from 'components/shared/DynamicPlot'
import { Box, Flex } from 'components/shared/jawns'
import { useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import styled from 'styled-components'
import { makePlotCopiedContent } from 'util/shared_content/helpers'

import { ApplyFiltersResponse } from './interfaces'

const TableWrapper = styled(Box)`
  height: 400px;
`

interface Props extends ApplyFiltersResponse {
  outputKind?: string | null
  datasetSlug: string
}

const ExploreDatasetOutput = ({ outputKind, plot_data, metric_data, table_data, datasetSlug }: Props) => {
  const { watch } = useFormContext()
  const datasetConfig = watch('dataset_config')

  const formattedTableData = useMemo(() => {
    return {
      ...table_data,
      columns: table_data.columns.map((column) => ({
        name: column.name,
        displayName: column.friendly_name,
        format: column.format,
        pinned: column.pinned,
        type: column.type,
      })),
    }
  }, [table_data])

  // only show content if there is a specified output kind
  if (!outputKind) {
    return null
  }

  // PLOT
  if (outputKind === 'plot') {
    const groupSlug = datasetConfig?.group_slug || plot_data?.config?.group_slug
    const plotSlug = datasetConfig?.plot_slug || plot_data?.config?.plot_slug

    const copyContentValues =
      groupSlug && plotSlug && datasetSlug ? makePlotCopiedContent({ datasetSlug, groupSlug, plotSlug }) : undefined

    return <DynamicPlot {...plot_data} copyContentValues={copyContentValues} />
  }

  // METRIC
  if (outputKind === 'metric') {
    return (
      <Flex justifyContent="center">
        <MetricGraphic {...metric_data} />
      </Flex>
    )
  }

  // TABLE
  if (outputKind === 'table') {
    return (
      <TableWrapper>
        <DataTable tableData={formattedTableData} isLoading={false} rowHeight={60} />
      </TableWrapper>
    )
  }

  // safety catch
  return null
}

export default ExploreDatasetOutput

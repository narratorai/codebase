import { Flex, Tooltip } from 'antd-next'
import { useCompany } from 'components/context/company/hooks'
import { DatasetIcon } from 'components/Navbar/NavIcons'
import CopyContentIcon from 'components/shared/CopyContentIcon'
import DataTable from 'components/shared/DataTable/DataTable'
import DownloadCsvIcon from 'components/shared/DataTable/DownloadCsvIcon'
import { ITableData } from 'components/shared/DataTable/interfaces'
import { Box, Link } from 'components/shared/jawns'
import queryString from 'query-string'
import { INarrativeTableContentMetaData } from 'util/blocks/interfaces'
import { makeTableCopiedContent } from 'util/shared_content/helpers'
interface TableData extends ITableData {
  metadata: INarrativeTableContentMetaData
}

interface Props {
  data: TableData
  datasetConfig: {
    datasetSlug: string
    groupSlug: string
    plotSlug: string
  }
}

// Shows the data table of the group
const TableContent = ({ data, datasetConfig }: Props) => {
  const company = useCompany()

  const datasetSlug = datasetConfig.datasetSlug
  const groupSlug = datasetConfig.groupSlug
  const plotSlug = datasetConfig.plotSlug

  const copiedContent = makeTableCopiedContent({
    dataset_slug: datasetSlug,
    group_slug: datasetConfig.groupSlug,
    as_data_table: true,
  })

  // narrative_slug and upload_key are useful when going to a dataset from assembled nar/dash
  const datasetLinkSearchParams = queryString.stringify({
    group: groupSlug,
    plot: plotSlug,
    view: plotSlug ? 'plot' : undefined,
  })

  return (
    <div style={{ height: '528px' }}>
      <Flex justify="flex-end">
        <Flex align="center">
          {datasetSlug && groupSlug && (
            <Box mr={1}>
              <Tooltip title={'Source Dataset'}>
                <Link
                  data-test="link-to-dataset"
                  href={`/${company.slug}/datasets/edit/${datasetSlug}?${datasetLinkSearchParams}`}
                  target="_blank"
                  style={{ color: 'inherit' }}
                >
                  <DatasetIcon />
                </Link>
              </Tooltip>
            </Box>
          )}

          <CopyContentIcon content={copiedContent} />

          <DownloadCsvIcon data={data} title={data?.metadata?.title} />
        </Flex>
      </Flex>
      <DataTable metadata={data.metadata} tableData={data} isLoading={false} />
    </div>
  )
}

export default TableContent

import { DragStoppedEvent } from '@ag-grid-community/core'
import { Button, Tooltip } from 'antd-next'
import ErrorBoundary from 'components/ErrorBoundary'
import { DatasetIcon } from 'components/Navbar/NavIcons'
import CopyContentIcon from 'components/shared/CopyContentIcon'
import DataTable from 'components/shared/DataTable/DataTable'
import DownloadCsvIcon from 'components/shared/DataTable/DownloadCsvIcon'
import DetailModal, { OpenCloseFullScreenButton, useModalState } from 'components/shared/DetailModal'
import { Box, Flex, Typography } from 'components/shared/jawns'
import OverscrollHover from 'components/shared/OverscrollHover'
import styled, { css } from 'styled-components'
import { INarrativeTableContent } from 'util/blocks/interfaces'
import { makeOrderedTableColumns, sortTableColumns } from 'util/narratives/helpers'
import { ITableColumnOrder } from 'util/narratives/interfaces'
import { CopiedTableContent } from 'util/shared_content/interfaces'

// TODO: the print styles merely hide the scrollbars in the table.
// A better approach would be to draw the entire table when printing
// but sizing that properly isn't trivial.
const TableWrapper = styled(Box)<{ modalOpen: boolean; isDashboard: boolean }>`
  ${({ modalOpen, isDashboard }) =>
    !modalOpen &&
    css`
      height: ${isDashboard ? 'calc(100% - 32px)' : '80%'};
    `}

  ${({ modalOpen }) =>
    modalOpen &&
    css`
      height: 100%;
    `}
`

const TableControls = styled(Flex)`
  @media print {
    display: none;
  }
`

interface Props {
  content: INarrativeTableContent
  copyContentValues?: CopiedTableContent
  isDashboard?: boolean
  onUpdateColumnOrder?: ({ left, right, order }: ITableColumnOrder) => void
  columnOrder?: ITableColumnOrder
}

/**
 * This component is used by Narratives to display a data table.
 *
 * Technically it's a block element that can be returned as the result of block submit
 * but it's used in Narratives mostly
 */
const NarrativeDataTable = ({
  content,
  copyContentValues,
  isDashboard = false,
  onUpdateColumnOrder,
  columnOrder,
}: Props) => {
  const sourceUrl = content?.metadata?.url
  const title = content?.metadata?.title

  const { isOpen, openModal, closeModal } = useModalState()

  const handleOnDragStopped = (event: DragStoppedEvent) => {
    // only update column order if the callback is provided
    if (!onUpdateColumnOrder) {
      return null
    }

    const columnsByOrder = makeOrderedTableColumns(event)
    onUpdateColumnOrder(columnsByOrder)
  }

  // if no column order has been changed, use the order from the content
  // otherwise use the columnOrder provided
  const sortedColumns = sortTableColumns({ columns: content.columns, columnOrder })

  return (
    <OverscrollHover style={{ height: '100%' }}>
      <DetailModal isOpen={isOpen} onClose={closeModal}>
        {/* Top section with title/controls */}
        <Flex justifyContent="space-between">
          <Typography ml={1} type="title400">
            {title}
          </Typography>
          <TableControls mb={1} justifyContent="flex-end" alignItems="center">
            {sourceUrl && (
              <Tooltip title="Source Dataset">
                <a href={sourceUrl} target="_blank" style={{ color: 'inherit' }} rel="noreferrer">
                  <Button icon={<DatasetIcon />} size="small" type="text" />
                </a>
              </Tooltip>
            )}

            {copyContentValues && (
              <Button icon={<CopyContentIcon content={copyContentValues} />} size="small" type="text" />
            )}

            <OpenCloseFullScreenButton isOpen={isOpen} openModal={openModal} closeModal={closeModal} />

            <DownloadCsvIcon data={content} title={title} />
          </TableControls>
        </Flex>

        {/* Table Section */}
        <ErrorBoundary>
          <TableWrapper modalOpen={isOpen} isDashboard={isDashboard} data-private>
            <DataTable
              metadata={content.metadata}
              tableData={{
                columns: sortedColumns.map((column) => {
                  return {
                    name: column.name,
                    displayName: column.friendly_name,
                    format: column.format,
                    pinned: column.pinned,
                    type: column.type,
                  }
                }),
                rows: content.rows,
              }}
              isLoading={false}
              rowHeight={60}
              onDragStopped={handleOnDragStopped}
            />
          </TableWrapper>
        </ErrorBoundary>
      </DetailModal>
    </OverscrollHover>
  )
}

export default NarrativeDataTable

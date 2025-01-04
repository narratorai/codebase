import React, { useState } from 'react'

import { useCompany } from '@/stores/companies'
import { IRemoteOutputConfig } from '@/stores/datasets'
import { useUser } from '@/stores/users'
import { formatDistanceToNow } from '@/util/formatters'

import DatasetOptionsDropdown from './DatasetOptionsDropdown'
import { useAsyncDownload, useCopyDataset, useDownload, useSendToGoogleSheets } from './hooks'
import { ISendToGSheetFormSubmitData } from './interfaces'
import SendToGSheetDialog from './SendToGSheetDialog'

type Props = {
  onDrillInto?: () => void
  onExplore?: () => void
  onViewFullScreen?: () => void
} & Pick<
  IRemoteOutputConfig,
  'appliedFilters' | 'datasetId' | 'datasetName' | 'isAll' | 'plotSlug' | 'snapshotTime' | 'tabSlug'
>

const DatasetOptionsMenu = ({
  appliedFilters,
  datasetId,
  datasetName,
  isAll,
  plotSlug,
  snapshotTime,
  tabSlug,
  onDrillInto,
  onExplore,
  onViewFullScreen,
}: Props) => {
  const [showSendToGSheetDialog, setShowSendToGSheetDialog] = useState<boolean>(false)
  const company = useCompany()
  const accessRoles = useUser((state) => state.accessRoles)
  const formattedSnapshotTime = formatDistanceToNow(snapshotTime || '', company)
  const { mutateAsync: sendToGoogleSheets } = useSendToGoogleSheets()
  const { mutateAsync: copyDataset } = useCopyDataset()
  const { mutateAsync: downloadData } = useDownload()
  const { mutateAsync: asyncDownloadData } = useAsyncDownload()

  const goToDatasetHref = `/datasets/d/${datasetId}?group=${tabSlug}&plot=${plotSlug}`

  const openSendToGSheetDialog = () => setShowSendToGSheetDialog(true)
  const closeSendToGSheetDialog = () => setShowSendToGSheetDialog(false)

  const handleSendToGSheet = async (submitData: ISendToGSheetFormSubmitData) => {
    const { sheetKey } = submitData
    await sendToGoogleSheets({ datasetId, tabSlug, sheetKey })
    closeSendToGSheetDialog()
  }

  const handleCopyDataset = async () => {
    await copyDataset({ datasetId, tabSlug, plotSlug, data: { name: datasetName, appliedFilters } })
  }

  const handleDownloadData = async (format: 'csv' | 'xls') => {
    if (isAll) {
      await downloadData({ datasetId, tabSlug, format, data: { appliedFilters } })
    } else {
      await asyncDownloadData({ datasetId, tabSlug, format, data: { appliedFilters } })
    }
  }

  const handleDownloadDataCSV = () => handleDownloadData('csv')
  const handleDownloadDataXLS = () => handleDownloadData('xls')

  return (
    <>
      <DatasetOptionsDropdown
        accessRoles={accessRoles}
        datasetName={datasetName}
        goToDatasetHref={goToDatasetHref}
        onCopyDatasetClick={handleCopyDataset}
        onCopyForReportClick={() => {}}
        onDownloadDataCSVClick={handleDownloadDataCSV}
        onDownloadDataXLSClick={handleDownloadDataXLS}
        onDrillIntoClick={onDrillInto}
        onExploreClick={onExplore}
        onSendToGsheetClick={openSendToGSheetDialog}
        onViewFullScreenClick={onViewFullScreen}
        snapshotTime={formattedSnapshotTime}
      />
      <SendToGSheetDialog
        onCancel={closeSendToGSheetDialog}
        onSubmit={handleSendToGSheet}
        open={showSendToGSheetDialog}
      />
    </>
  )
}

export default DatasetOptionsMenu

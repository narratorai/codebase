/* eslint-disable max-lines-per-function */
import {
  ArrowsPointingOutIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpOnSquareIcon,
  ArrowUpOnSquareStackIcon,
  CloudArrowDownIcon,
  DocumentMagnifyingGlassIcon,
  EllipsisVerticalIcon,
  InformationCircleIcon,
  Square2StackIcon,
  WindowIcon,
} from '@heroicons/react/16/solid'
import React from 'react'

import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSection,
} from '@/components/primitives/Dropdown'
import { IAccessRoles } from '@/stores/users'

interface Props {
  accessRoles: IAccessRoles
  datasetName: string
  goToDatasetHref: string
  onCopyDatasetClick: () => void
  onCopyForReportClick: () => void
  onDownloadDataCSVClick: () => void
  onDownloadDataXLSClick: () => void
  onDrillIntoClick?: () => void
  onExploreClick?: () => void
  onSendToGsheetClick: () => void
  onViewFullScreenClick?: () => void
  snapshotTime: string
}

const DatasetOptionsMenu = ({
  accessRoles,
  datasetName,
  goToDatasetHref,
  onCopyDatasetClick,
  onCopyForReportClick,
  onDownloadDataCSVClick,
  onDownloadDataXLSClick,
  onDrillIntoClick,
  onExploreClick,
  onSendToGsheetClick,
  onViewFullScreenClick,
  snapshotTime,
}: Props) => (
  <Dropdown>
    <DropdownButton
      aria-label="Dropdown Button"
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
      plain
    >
      <EllipsisVerticalIcon />
    </DropdownButton>
    <DropdownMenu>
      <DropdownSection>
        <DropdownItem disabled>
          <InformationCircleIcon />
          <DropdownLabel>{snapshotTime}</DropdownLabel>
        </DropdownItem>
      </DropdownSection>

      <DropdownDivider />

      {accessRoles.DownloadData && (
        <>
          <DropdownSection>
            <DropdownItem onClick={onDownloadDataCSVClick}>
              <CloudArrowDownIcon />
              <DropdownLabel>Download data (CSV)</DropdownLabel>
            </DropdownItem>
            <DropdownItem onClick={onDownloadDataXLSClick}>
              <CloudArrowDownIcon />
              <DropdownLabel>Download data (XLS)</DropdownLabel>
            </DropdownItem>
            <DropdownItem onClick={onSendToGsheetClick}>
              <ArrowUpOnSquareIcon />
              <DropdownLabel>Send to Gsheet</DropdownLabel>
            </DropdownItem>
          </DropdownSection>

          <DropdownDivider />
        </>
      )}

      {accessRoles.ViewDataset && (
        <>
          <DropdownSection>
            <DropdownItem href={goToDatasetHref} target="_blank">
              <ArrowTopRightOnSquareIcon />
              <DropdownLabel>Go to dataset ({datasetName})</DropdownLabel>
            </DropdownItem>

            {accessRoles.CreateDataset && (
              <DropdownItem onClick={onCopyDatasetClick}>
                <ArrowUpOnSquareStackIcon />
                <DropdownLabel>Copy "{datasetName}" to new dataset</DropdownLabel>
              </DropdownItem>
            )}
          </DropdownSection>

          <DropdownDivider />
        </>
      )}

      <DropdownSection>
        <DropdownItem onClick={onViewFullScreenClick}>
          <ArrowsPointingOutIcon />
          <DropdownLabel>View full screen</DropdownLabel>
        </DropdownItem>
        {accessRoles.ViewDataset && (
          <>
            <DropdownItem onClick={onDrillIntoClick}>
              <DocumentMagnifyingGlassIcon />
              <DropdownLabel>Drill into</DropdownLabel>
            </DropdownItem>
            <DropdownItem onClick={onExploreClick}>
              <WindowIcon />
              <DropdownLabel>Explore</DropdownLabel>
            </DropdownItem>
          </>
        )}
      </DropdownSection>

      <DropdownDivider />

      <DropdownSection>
        <DropdownItem onClick={onCopyForReportClick}>
          <Square2StackIcon />
          <DropdownLabel>Copy for report</DropdownLabel>
        </DropdownItem>
      </DropdownSection>
    </DropdownMenu>
  </Dropdown>
)

export default DatasetOptionsMenu

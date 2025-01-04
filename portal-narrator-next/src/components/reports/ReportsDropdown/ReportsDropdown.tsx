import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'

import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownMenu,
  DropdownSection,
} from '@/components/primitives/Dropdown'

import AutosaveItem from './AutoSaveItem'
import DeleteReportItem from './DeleteReportItem'
import FullWidthItem from './FullWidthItem'
import ReadOnlyItem from './ReadOnlyItem'
import ReportMetaSection from './ReportMetaSection'

export default function ReportsDropdown() {
  return (
    <Dropdown>
      <DropdownButton plain>
        <EllipsisHorizontalIcon />
      </DropdownButton>

      <DropdownMenu>
        <DropdownSection>
          <FullWidthItem />
          <ReadOnlyItem />
          <AutosaveItem />
        </DropdownSection>
        <DropdownDivider />
        <DropdownSection>
          <DeleteReportItem />
        </DropdownSection>
        <DropdownDivider />

        <DropdownSection>
          <ReportMetaSection />
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  )
}

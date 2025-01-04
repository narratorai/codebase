'use client'

import PageHeader from '@/components/shared/PageHeader'

import ReportsDropdown from '../ReportsDropdown'
import ApplyFiltersButton from './ApplyFiltersButton'
import EditReportPageTitle from './EditReportPageTitle'
import ReportBookmarkButton from './ReportBookmarkButton'
import SaveReportButton from './SaveReportButton'

export default function EditReportPageHeader() {
  return (
    <PageHeader className="grid grid-cols-3 content-center gap-4">
      <div className="gap-1 text-xs font-medium flex-x-center">
        <EditReportPageTitle />
      </div>

      <div className="justify-self-center" />
      <div className="justify-self-end flex-x-center">
        <ApplyFiltersButton />
        <SaveReportButton />
        <ReportBookmarkButton />
        <ReportsDropdown />
      </div>
    </PageHeader>
  )
}

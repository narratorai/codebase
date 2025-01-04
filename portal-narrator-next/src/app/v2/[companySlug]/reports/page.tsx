import { Metadata } from 'next'

import { Breadcrumb, BreadcrumbContainer } from '@/components/primitives/Breadcrumb'
import NewReportButton from '@/components/reports/NewReportButton'
import ReportsList from '@/components/reports/ReportsList'
import ReportsSearchBox from '@/components/reports/ReportsSearchBox'
import Page from '@/components/shared/Page'
import PageContent from '@/components/shared/PageContent'
import PageHeader from '@/components/shared/PageHeader'
import { auth0 } from '@/util/server/auth0'

export const metadata: Metadata = {
  title: 'Reports',
}

async function ReportsIndexPage() {
  return (
    <Page>
      <PageHeader className="gap-4 flex-x-center">
        <BreadcrumbContainer>
          <Breadcrumb isRoot>Reports</Breadcrumb>
        </BreadcrumbContainer>
        <div className="ml-8 flex-1">
          <ReportsSearchBox />
        </div>
        <NewReportButton />
      </PageHeader>
      <PageContent>
        <ReportsList />
      </PageContent>
    </Page>
  )
}

export default auth0.withPageAuthRequired(ReportsIndexPage)

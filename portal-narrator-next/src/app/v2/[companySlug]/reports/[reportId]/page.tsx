import { AppRouterPageRouteOpts } from '@auth0/nextjs-auth0'
import { Metadata } from 'next'

import EditReportPageHeader from '@/components/reports/EditReportPageHeader'
import StoredReport from '@/components/reports/StoredReport'
import Page from '@/components/shared/Page'
import PageContent from '@/components/shared/PageContent'
import { auth0 } from '@/util/server/auth0'

export const metadata: Metadata = {
  title: 'Reports',
}

async function ReportPage({ params }: AppRouterPageRouteOpts) {
  const { reportId } = params as { reportId: string }

  return (
    <Page>
      <EditReportPageHeader />
      <PageContent>
        <StoredReport id={reportId} />
      </PageContent>
    </Page>
  )
}

export default auth0.withPageAuthRequired(ReportPage)

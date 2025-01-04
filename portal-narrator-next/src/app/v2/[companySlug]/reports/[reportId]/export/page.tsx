'use client'

import { useShallow } from 'zustand/react/shallow'

import { useReportQuery } from '@/components/reports/hooks'
import BlockEditor from '@/components/shared/BlockEditor'
import Page from '@/components/shared/Page'
import Spin from '@/components/shared/Spin'
import { ContentAdapter, useReport } from '@/stores/reports'

type QueryParams = {
  reportId: string
  runKey?: string
}

export default function ReportExportPage({ params }: { params: QueryParams }) {
  const { reportId, runKey } = params
  const { isError, isSuccess } = useReportQuery(reportId)
  const [content, lastRun] = useReport(useShallow((state) => [state.content, state.lastRun]))

  if (isError) return <div className="mx-auto p-10 text-red-600">Error loading report</div>
  return (
    <Page hideChatWidget>
      <div data-export-container>
        {isSuccess ? (
          <BlockEditor
            compileContext={{ reportId, runKey: runKey ?? lastRun?.key }}
            content={ContentAdapter.getJSONContent(content)}
            readOnly
          />
        ) : (
          <Spin />
        )}
      </div>
    </Page>
  )
}

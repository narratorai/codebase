'use client'

import { isNil } from 'lodash'
import { useShallow } from 'zustand/react/shallow'

import { useCompany } from '@/stores/companies'
import { useReport } from '@/stores/reports'
import { formatDateTime } from '@/util/formatters'

export default function ReportMetaSection() {
  const company = useCompany()
  const [content, createdAt, updatedAt] = useReport(
    useShallow((state) => [state.content, state.createdAt, state.updatedAt])
  )

  return (
    <section className="space-y-0.5 p-3 text-xs text-gray-400">
      <p>Word count: {content?.document.meta?.wordCount ?? 0}</p>

      {isNil(updatedAt) ? (
        <p>Created at {formatDateTime(createdAt as string, company)}</p>
      ) : (
        <p>Updated at {formatDateTime(updatedAt as string, company)}</p>
      )}
    </section>
  )
}

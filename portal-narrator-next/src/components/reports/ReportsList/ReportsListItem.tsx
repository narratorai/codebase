'use client'

import Link from 'next/link'
import FileIcon from 'static/mavis/icons/file.svg'

import { useCompanySlugParam } from '@/hooks'
import { IRemoteReport } from '@/stores/reports/interfaces'

interface Props {
  report: Omit<IRemoteReport, 'content'>
}

export default function ReportsListItem({ report }: Props) {
  const companySlug = useCompanySlugParam()

  const { name, screenshot } = report
  const href = `/v2/${companySlug}/reports/${report.id}`

  return (
    <li className="box-gray-100 overflow-hidden rounded-xl">
      <Link href={href}>
        <div className="h-40 overflow-hidden">
          {screenshot ? (
            <img alt={name} src={`/api/attachments/${screenshot.attachmentId}.${screenshot.fileExtension}`} />
          ) : null}
        </div>
        <hr className="border-gray-100" />
        <div className="gap-2 p-4 flex-x-center">
          <FileIcon className="size-6 stroke-gray-400" />
          <p className="truncate text-sm font-medium">{name}</p>
        </div>
      </Link>
    </li>
  )
}

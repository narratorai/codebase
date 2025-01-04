'use client'

import { Breadcrumb, BreadcrumbContainer, BreadcrumbLink } from '@/components/primitives/Breadcrumb'
import { useCompanySlugParam } from '@/hooks'

import EditableReportName from './EditableReportName'

export default function EditReportPageTitle() {
  const companySlug = useCompanySlugParam()

  return (
    <BreadcrumbContainer>
      <BreadcrumbLink href={`/v2/${companySlug}/reports`} isRoot>
        Reports
      </BreadcrumbLink>
      <Breadcrumb>
        <EditableReportName />
      </Breadcrumb>
    </BreadcrumbContainer>
  )
}

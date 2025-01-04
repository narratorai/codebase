'use client'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/primitives/Button'
import { useCompanySlugParam } from '@/hooks'
import { useReports } from '@/stores/reports'

export default function NewReportButton() {
  const companySlug = useCompanySlugParam()
  const router = useRouter()
  const createReport = useReports((state) => state.createReport)
  const { isPending, mutateAsync: create } = useMutation({ mutationFn: createReport })

  const handleClick = async () => {
    const response = await create({ name: 'Untitled' })
    router.push(`/v2/${companySlug}/reports/${response.id}`)
  }

  return (
    <Button disabled={isPending} onClick={handleClick}>
      Create new
      <PlusIcon className="size-5" />
    </Button>
  )
}

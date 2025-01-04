'use client'

import { isEmpty } from 'lodash'
import { useEffect } from 'react'

import { Button } from '@/components/primitives/Button'
import { useSearchParams } from '@/hooks'
import { useReportFilters } from '@/stores/reports'

export default function ApplyFiltersButton() {
  const [, , setSearchParams] = useSearchParams()
  const [commitFilters, stagedFilters, committedFilters] = useReportFilters((state) => [
    state.commit,
    state.staged,
    state.committed,
  ])

  useEffect(() => {
    setSearchParams(committedFilters)
  }, [committedFilters])

  if (isEmpty(stagedFilters)) return null
  return (
    <Button onClick={commitFilters} title="Apply filters">
      Apply filters
    </Button>
  )
}

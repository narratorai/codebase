'use client'

import { useSearchParams } from '@/hooks'

import ReportsSearchForm, { ReportsSearchFormData } from './ReportsSearchForm'

export default function ReportsSearchBox() {
  const [searchParams, setSearchParam] = useSearchParams()

  const applySearch = ({ search }: ReportsSearchFormData) => {
    setSearchParam('search', search)
  }

  return <ReportsSearchForm defaultValues={searchParams as ReportsSearchFormData} onSubmit={applySearch} />
}

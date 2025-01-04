'use client'

import EmptyState from '@/components/primitives/EmptyState'
import Loading from '@/components/primitives/Loading'
import { useSearchParams } from '@/hooks'

import FilterButtonGroup from './FilterButtonGroup'
import { useReportsQuery } from './hooks'
import ReportsGrid from './ReportsGrid'
import ReportsTable from './ReportsTable'
import ViewModeButtonGroup, { ViewMode } from './ViewModeButtonGroup'

export default function ReportsList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const viewMode = (searchParams.viewMode as ViewMode) ?? 'grid'

  const { isLoading, data } = useReportsQuery()

  const setViewMode = (viewMode: ViewMode) => {
    setSearchParams('viewMode', viewMode)
  }

  const setFavoritedFilter = (favorited: boolean) => {
    setSearchParams('favorited', favorited ? 'true' : null)
  }

  if (data.length === 0) return <EmptyState title="No reports" />
  if (isLoading) return <Loading />
  return (
    <section className="space-y-4 p-10">
      <div className="justify-between space-x-2 flex-x-center">
        <FilterButtonGroup onClick={setFavoritedFilter} />
        <ViewModeButtonGroup onClick={setViewMode} viewMode={viewMode as ViewMode} />
      </div>
      {viewMode === 'grid' ? <ReportsGrid reports={data} /> : <ReportsTable reports={data} />}
    </section>
  )
}

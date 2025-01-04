import AddFilterIcon from 'static/mavis/icons/filter-add.svg'

import { Card, CardBody, CardHeader } from '@/components/primitives/Card'
import EmptyState from '@/components/primitives/EmptyState'

interface Props {
  isNodeEditable?: boolean
  onClick: () => void
}

/**
 * Placeholder for the filter node view.
 */
export default function FilterNodePlaceholder({ onClick, isNodeEditable = false }: Props) {
  if (!isNodeEditable)
    return (
      <Card well>
        <EmptyState description="This filter is not configured" title="Filter unavailable" />
      </Card>
    )

  return (
    <Card divided>
      <CardHeader>
        <div className="space-x-2 flex-x-center">
          <AddFilterIcon className="h-6 w-6 text-gray-800" />
          <h3>Filter</h3>
        </div>
      </CardHeader>
      <CardBody>
        <button
          className="h-full w-full rounded-lg border-dashed p-4 text-center text-sm text-gray-400 bordered-gray-100"
          onClick={onClick}
        >
          Edit filter
        </button>
      </CardBody>
    </Card>
  )
}

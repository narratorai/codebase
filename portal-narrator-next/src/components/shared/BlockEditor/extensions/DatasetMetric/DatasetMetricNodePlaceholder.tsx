import { Button } from '@/components/primitives/Button'
import { Card } from '@/components/primitives/Card'
import EmptyState from '@/components/primitives/EmptyState'

interface Props {
  isNodeEditable?: boolean
  onClick: () => void
}

/**
 * Placeholder for the dataset metric node view.
 */
export default function DatasetMetricNodePlaceholder({ onClick, isNodeEditable = false }: Props) {
  return (
    <Card well>
      <div className="flex h-full items-center justify-center">
        {isNodeEditable ? (
          <div className="p-4">
            <Button onClick={onClick}>Edit metric</Button>
          </div>
        ) : (
          <EmptyState description="This metric has no data available" title="No data" />
        )}
      </div>
    </Card>
  )
}

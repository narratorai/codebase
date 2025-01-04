import { Button } from '@/components/primitives/Button'
import { Card } from '@/components/primitives/Card'
import EmptyState from '@/components/primitives/EmptyState'

interface Props {
  isNodeEditable?: boolean
  onClick: () => void
}

/**
 * Placeholder for the data table node view.
 */
export default function DataTableNodePlaceholder({ onClick, isNodeEditable = false }: Props) {
  return (
    <Card well>
      <div className="flex h-full items-center justify-center">
        {isNodeEditable ? (
          <div className="p-4">
            <Button onClick={onClick}>Edit table</Button>
          </div>
        ) : (
          <EmptyState description="This table has no data to display" title="No data" />
        )}
      </div>
    </Card>
  )
}

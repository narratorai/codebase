import { Button } from '@/components/primitives/Button'
import { Card } from '@/components/primitives/Card'
import EmptyState from '@/components/primitives/EmptyState'

interface Props {
  isNodeEditable?: boolean
  onClick: () => void
}

/**
 * Placeholder for the decision node view.
 */
export default function DecisionNodePlaceholder({ onClick, isNodeEditable = false }: Props) {
  return (
    <Card well>
      <div className="flex h-full items-center justify-center">
        {isNodeEditable ? (
          <div className="p-4">
            <Button onClick={onClick}>Edit decision</Button>
          </div>
        ) : (
          <EmptyState description="This decision has no data to display" title="No data" />
        )}
      </div>
    </Card>
  )
}

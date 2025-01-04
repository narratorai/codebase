import { Button } from '@/components/primitives/Button'
import { Card } from '@/components/primitives/Card'
import EmptyState from '@/components/primitives/EmptyState'

interface Props {
  isNodeEditable?: boolean
  onClick: () => void
}

/**
 * Placeholder for the plot node view.
 */
export default function PlotNodePlaceholder({ onClick, isNodeEditable = false }: Props) {
  return (
    <Card well>
      <div className="flex h-full items-center justify-center">
        {isNodeEditable ? (
          <Button onClick={onClick}>Edit plot</Button>
        ) : (
          <EmptyState description="This plot has no data to display." title="No data" />
        )}
      </div>
    </Card>
  )
}

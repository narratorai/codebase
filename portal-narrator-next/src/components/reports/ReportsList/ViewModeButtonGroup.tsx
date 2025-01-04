import { ListBulletIcon } from '@heroicons/react/20/solid'
import { Squares2X2Icon } from '@heroicons/react/24/outline'

import { Button } from '@/components/primitives/Button'

export type ViewMode = 'list' | 'grid'

interface Props {
  onClick: (viewMode: ViewMode) => void
  viewMode: ViewMode
}

export default function ViewModeButtonGroup({ viewMode, onClick }: Props) {
  return (
    <div className="space-x-1">
      <Button onClick={() => onClick('list')} outline={viewMode !== 'list'}>
        <ListBulletIcon />
      </Button>
      <Button onClick={() => onClick('grid')} outline={viewMode !== 'grid'}>
        <Squares2X2Icon />
      </Button>
    </div>
  )
}

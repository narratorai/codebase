import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'

import { AvatarButton } from '@/components/primitives/Avatar'
import { Button } from '@/components/primitives/Button'
import DatasetCollectionItemView from '@/components/shared/DatasetCollectionItemView'
import { IRemoteCollectionDataset } from '@/stores/datasets'

interface Props {
  onClear?: () => void
  onClick?: () => void
  value?: IRemoteCollectionDataset
}

const DatasetsSearchAdvancedTrigger = ({ value, onClick, onClear }: Props) =>
  value ? (
    <DatasetCollectionItemView value={value}>
      <AvatarButton data-slot="sm-trail-icon" icon="SolidXMarkIcon" onClick={onClear} size="xs" />
    </DatasetCollectionItemView>
  ) : (
    <Button aria-label="Search chat history" onClick={onClick} plain>
      Select Dataset
      <MagnifyingGlassIcon />
    </Button>
  )

export default DatasetsSearchAdvancedTrigger

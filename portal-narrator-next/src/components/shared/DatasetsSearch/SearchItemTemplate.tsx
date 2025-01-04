import { ComboboxOptionProps } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/24/outline'
import React, { forwardRef } from 'react'

import { SearchboxItem } from '@/components/primitives/Searchbox'
import DatasetCollectionItemView from '@/components/shared/DatasetCollectionItemView'
import { IRemoteCollectionDataset } from '@/stores/datasets'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = {
  value: IRemoteCollectionDataset
} & Omit<ComboboxOptionProps, 'className' | 'as' | 'value'>

const SearchItemTemplate = ({ value, ...props }: Props, ref: Ref) => (
  <SearchboxItem {...props} ref={ref} value={value}>
    <DatasetCollectionItemView value={value}>
      <CheckIcon data-slot="selection" />
    </DatasetCollectionItemView>
  </SearchboxItem>
)

export default forwardRef(SearchItemTemplate)

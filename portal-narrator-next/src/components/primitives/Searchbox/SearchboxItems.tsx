'use client'

import { ComboboxOptions, ComboboxOptionsProps } from '@headlessui/react'
import { forwardRef } from 'react'

import Loading, { ILoading } from '../Loading'

type Ref = React.ForwardedRef<HTMLDivElement>

interface Props extends Omit<ComboboxOptionsProps, 'className'> {
  isLoading?: boolean
  OptionTemplate: React.ElementType
  searchboxLoading?: ILoading
}

const SearchboxItems = ({ isLoading, onScroll, OptionTemplate, searchboxLoading }: Props, ref: Ref) => (
  <div className="max-h-96 transform-gpu scroll-py-3 overflow-y-auto p-3" onScroll={onScroll}>
    <ComboboxOptions className="h-full min-h-1" ref={ref} static>
      {({ option }) => <OptionTemplate value={option} />}
    </ComboboxOptions>
    {isLoading && <Loading {...searchboxLoading} />}
  </div>
)

export default forwardRef(SearchboxItems)

import React, { ForwardedRef, forwardRef } from 'react'
import SearchIcon from 'static/mavis/icons/search.svg'

import IconTextInput from '@/components/shared/IconTextInput'
import Spin from '@/components/shared/Spin'

interface Props {
  onSearch: (value: string) => void
  isFetching: boolean
}

const SearchInput = ({ onSearch, isFetching }: Props, ref: ForwardedRef<HTMLInputElement>) => (
  <IconTextInput
    LeadingIcon={SearchIcon}
    TrailingIcon={isFetching ? Spin : undefined}
    onChange={(e) => onSearch(e.target.value)}
    ref={ref}
  />
)

export default forwardRef(SearchInput)

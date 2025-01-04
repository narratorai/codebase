import { ComboboxOption, ComboboxOptionProps } from '@headlessui/react'
import clsx from 'clsx'
import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props<T> = Omit<ComboboxOptionProps<'div', T>, 'className'>

const SearchboxItem = <T,>(props: Props<T>, ref: Ref) => (
  <ComboboxOption
    className={clsx(
      // Base styles
      'group flex w-full cursor-default select-none rounded-xl p-3 data-[focus]:bg-gray-100',
      // Disabled state
      'data-[disabled]:opacity-50'
    )}
    ref={ref}
    {...props}
  />
)

export default forwardRef(SearchboxItem)

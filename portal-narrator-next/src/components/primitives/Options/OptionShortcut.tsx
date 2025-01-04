import clsx from 'clsx'
import { forwardRef } from 'react'

type Ref = React.ForwardedRef<HTMLElement>

type Props = {
  keys: string | string[]
}

const OptionShortcut = ({ keys }: Props, ref: Ref) => (
  <kbd className="col-start-5 row-start-1 flex justify-self-end" ref={ref}>
    {(Array.isArray(keys) ? keys : keys.split('')).map((char, index) => (
      <kbd
        className={clsx(
          'min-w-[2ch] text-center font-sans capitalize text-zinc-400 group-data-[focus]:text-white forced-colors:group-data-[focus]:text-[HighlightText]',
          index > 0 && char.length > 1 && 'pl-1'
        )}
        key={index}
      >
        {char}
      </kbd>
    ))}
  </kbd>
)

export default forwardRef(OptionShortcut)

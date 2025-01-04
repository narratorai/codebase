import clsx from 'clsx'
import { forwardRef } from 'react'

import { OPTION_STYLE } from './constants'

type Ref = React.ForwardedRef<HTMLButtonElement>

type Props = Omit<React.ComponentPropsWithoutRef<'button'>, 'className'>

const ButtonOption = (props: Props, ref: Ref) => (
  <button className={clsx(OPTION_STYLE)} ref={ref} type="button" {...props} />
)

export default forwardRef(ButtonOption)

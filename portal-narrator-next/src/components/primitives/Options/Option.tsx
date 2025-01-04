import clsx from 'clsx'
import React, { forwardRef } from 'react'

import { OPTION_STYLE } from './constants'

type Ref = React.ForwardedRef<HTMLDivElement>

type Props = Omit<React.ComponentPropsWithoutRef<'div'>, 'className'>

const Option = (props: Props, ref: Ref) => <div className={clsx(OPTION_STYLE)} ref={ref} {...props} />

export default forwardRef(Option)

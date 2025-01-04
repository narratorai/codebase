import clsx from 'clsx'
import { forwardRef } from 'react'

import { Link } from '../Link'
import { OPTION_STYLE } from './constants'

type Ref = React.ForwardedRef<HTMLAnchorElement>

type Props = Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>

const LinkOption = (props: Props, ref: Ref) => <Link className={clsx(OPTION_STYLE)} ref={ref} {...props} />

export default forwardRef(LinkOption)

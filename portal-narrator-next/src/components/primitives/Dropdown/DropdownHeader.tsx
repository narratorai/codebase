import type React from 'react'

import { OptionHeader } from '../Options'

type Props = React.ComponentPropsWithoutRef<'div'>

const DropdownHeader = (props: Props) => <OptionHeader {...props} />

export default DropdownHeader

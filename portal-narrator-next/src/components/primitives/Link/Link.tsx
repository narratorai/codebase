import { DataInteractive } from '@headlessui/react'
import NextLink, { type LinkProps } from 'next/link'
import { forwardRef } from 'react'

import { LinkRef } from './interfaces'

type Props = LinkProps & React.ComponentPropsWithoutRef<'a'>

const Link = (props: Props, ref: LinkRef) => (
  <DataInteractive>
    <NextLink {...props} ref={ref} />
  </DataInteractive>
)

export default forwardRef(Link)

import type { DialogOverlayProps } from '@radix-ui/react-dialog'
import { Overlay } from '@radix-ui/react-dialog'
import clsx from 'clsx'
import React, { ForwardedRef, forwardRef } from 'react'

type Props = DialogOverlayProps & React.RefAttributes<HTMLDivElement>

const DialogOverlay = ({ className, ...props }: Props, ref: ForwardedRef<HTMLDivElement>) => (
  <Overlay ref={ref} className={clsx('fixed inset-0 bg-gray-1000/40', className)} {...props} />
)

export default forwardRef(DialogOverlay)

import { Title } from '@radix-ui/react-dialog'
import clsx from 'clsx'
import React from 'react'

interface Props {
  children: React.ReactNode
  className?: clsx.ClassValue
}

/**
 * An accessible title to be announced when the dialog is opened.
 */
const DialogTitle = ({ children, className }: Props) => (
  <Title className={clsx('font-medium', className)} asChild>
    {children}
  </Title>
)

export default DialogTitle

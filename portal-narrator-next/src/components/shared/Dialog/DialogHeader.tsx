import { Close } from '@radix-ui/react-dialog'
import clsx from 'clsx'
import React from 'react'
import CloseIcon from 'static/mavis/icons/close.svg'

import DialogTitle from './DialogTitle'

interface Props {
  children: React.ReactNode
  className?: clsx.ClassValue
  hideClose?: boolean
}

/**
 * Header for the dialog. It renders the title and close button.
 */
const DialogHeader = ({ children, className, hideClose = false }: Props) => (
  <div className={clsx('justify-between border-b border-gray-100 px-5 py-4 flex-x-center', className)}>
    <DialogTitle>{children}</DialogTitle>

    {!hideClose && (
      <Close className="button button-xs secondary text !w-auto">
        <CloseIcon className="button button-xs button-icon" />
      </Close>
    )}
  </div>
)

export default DialogHeader

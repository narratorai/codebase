'use client'

import { Transition } from '@headlessui/react'

import { Status } from './interfaces'
import NotificationIcon from './NotificationIcon'
import NotificationPanelCloseButton from './NotificationPanelCloseButton'
import NotificationPanelHeader from './NotificationPanelHeader'

export interface Props {
  description?: string
  label: string
  onClose: () => void
  open: boolean
  status?: Status
}

/**
 * Notification Panel
 *
 * Dynamically insert this into the
 * Global Notification Live Region when it needs to be displayed
 */
const NotificationPanel = ({ description, label, onClose, open, status }: Props) => (
  <Transition show={open}>
    <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition data-[closed]:data-[enter]:translate-y-2 data-[enter]:transform data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-100 data-[enter]:ease-out data-[leave]:ease-in data-[closed]:data-[enter]:sm:translate-x-2 data-[closed]:data-[enter]:sm:translate-y-0">
      <div className="p-4">
        <div className="flex items-start">
          {status && (
            <div className="mr-3 flex-shrink-0">
              <NotificationIcon status={status} />
            </div>
          )}
          <NotificationPanelHeader description={description} title={label} />
          <NotificationPanelCloseButton onClick={onClose} />
        </div>
      </div>
    </div>
  </Transition>
)

export default NotificationPanel

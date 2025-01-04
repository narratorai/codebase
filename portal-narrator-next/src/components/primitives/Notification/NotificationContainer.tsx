'use client'
import React from 'react'

interface Props {
  children: React.ReactNode
}

/**
 * Global Notification Live Region
 *
 * Render this permanently at the end of the document
 */
const NotificationContainer = ({ children }: Props) => (
  <div
    aria-live="assertive"
    className="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6"
  >
    <div className="flex w-full flex-col items-center space-y-4 sm:items-end">{children}</div>
  </div>
)

export default NotificationContainer

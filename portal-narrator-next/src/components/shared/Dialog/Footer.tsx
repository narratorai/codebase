import React from 'react'

interface Props {
  children: React.ReactNode
}

const Footer = ({ children }: Props) => (
  <div className="border-t border-gray-100 px-6 py-4 flex-x-center">{children}</div>
)

export default Footer

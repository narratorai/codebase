import React from 'react'

interface Props extends React.RefAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const Label = ({ children, ...props }: Props) => (
  <p {...props} className="px-3 py-2 text-sm font-medium text-white">
    {children}
  </p>
)

export default Label
